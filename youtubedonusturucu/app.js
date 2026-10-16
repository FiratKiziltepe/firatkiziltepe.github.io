/**
 * YouTube MP3 / MP4 Dönüştürücü & Web Medya Stüdyosu
 * GitHub Pages %100 İstemci Taraflı (Client-Side) Ses ve Video İşleme Motoru
 */

const state = {
  mediaPool: [], // { id, name, type: 'audio'|'video', blob, url, duration, size }
  activeMediaId: null,
  audioBufferCache: new Map(), // mediaId -> AudioBuffer
  audioMergeQueue: [], // array of mediaId
  videoMergeQueue: [], // array of mediaId
  currentYtInfo: null, // { id, url, title, author, thumb, duration, streams, subtitles }
  audioCtx: null,
  previewSource: null,
  vizAnimId: null,
  vizBgImage: null,
  lastOutputBlob: null,
  lastOutputName: null,
  ffmpeg: null,
  ffmpegLoaded: false
};

// Public API Fallback Lists for YouTube Resolution
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://pipedapi.syncpundit.io'
];

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://vid.puffyan.us'
];

const COBALT_INSTANCES = [
  'https://cobalt-api.kwiatekmiki.com',
  'https://api.cobalt.tools'
];

// ==========================================
// UTILITY & UI HELPERS
// ==========================================
function getAudioContext() {
  if (!state.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioCtx();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const colors = {
    info: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  toast.style.borderLeftColor = colors[type] || colors.info;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

function setProgress(active, statusText = 'İşleniyor...', percent = 0) {
  const wrap = document.getElementById('processBarWrap');
  const textEl = document.getElementById('processStatusText');
  const pctEl = document.getElementById('processPercentText');
  const fillEl = document.getElementById('processProgressFill');
  if (!active) {
    wrap.classList.remove('active');
    return;
  }
  wrap.classList.add('active');
  textEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${statusText}`;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  pctEl.textContent = `${clamped}%`;
  fillEl.style.width = `${clamped}%`;
}

function showOutputResult(blob, filename, title = 'İşlem Tamamlandı!') {
  state.lastOutputBlob = blob;
  state.lastOutputName = filename;
  const url = URL.createObjectURL(blob);

  const box = document.getElementById('outputResultBox');
  const titleEl = document.getElementById('outputTitleText');
  const metaEl = document.getElementById('outputMetaText');
  const dlLink = document.getElementById('outputDownloadLink');
  const previewContainer = document.getElementById('outputPreviewContainer');

  box.classList.add('active');
  titleEl.textContent = title;
  metaEl.textContent = `${filename} • ${(blob.size / (1024 * 1024)).toFixed(2)} MB`;
  dlLink.href = url;
  dlLink.download = filename;

  previewContainer.innerHTML = '';
  if (filename.endsWith('.mp3') || filename.endsWith('.wav') || blob.type.startsWith('audio/')) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    audio.style.width = '100%';
    previewContainer.appendChild(audio);
  } else if (filename.endsWith('.gif') || blob.type === 'image/gif') {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxHeight = '260px';
    img.style.borderRadius = '8px';
    previewContainer.appendChild(img);
  } else if (blob.type.startsWith('video/') || filename.endsWith('.mp4') || filename.endsWith('.webm')) {
    const video = document.createElement('video');
    video.controls = true;
    video.src = url;
    video.style.maxHeight = '280px';
    video.style.maxWidth = '100%';
    video.style.borderRadius = '8px';
    previewContainer.appendChild(video);
  }

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ==========================================
// YOUTUBE ID PARSER & MULTI-API EXTRACTOR
// ==========================================
function extractYouTubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

async function fetchYouTubeMetadata(videoId) {
  const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const info = {
    id: videoId,
    url: fullUrl,
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Kanalı',
    thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: 0,
    audioStreams: [],
    videoStreams: [],
    subtitles: []
  };

  // 1. Always fetch fast title/author via noembed
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) info.title = data.title;
      if (data.author_name) info.author = data.author_name;
    }
  } catch (_) {}

  // 2. Try Piped instances for direct streams & subtitles
  for (const host of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(`${host}/streams/${videoId}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.title) info.title = data.title;
        if (data.uploader) info.author = data.uploader;
        if (data.duration) info.duration = data.duration;
        if (Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
          info.audioStreams = data.audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        }
        if (Array.isArray(data.videoStreams) && data.videoStreams.length > 0) {
          info.videoStreams = data.videoStreams;
        }
        if (Array.isArray(data.subtitles)) {
          info.subtitles = data.subtitles;
        }
        info.provider = `Piped (${new URL(host).hostname})`;
        return info;
      }
    } catch (_) {}
  }

  // 3. Try Invidious instances
  for (const host of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(`${host}/api/v1/videos/${videoId}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.title) info.title = data.title;
        if (data.author) info.author = data.author;
        if (data.lengthSeconds) info.duration = data.lengthSeconds;
        if (Array.isArray(data.adaptiveFormats)) {
          info.audioStreams = data.adaptiveFormats.filter(f => f.type && f.type.startsWith('audio/'));
        }
        if (Array.isArray(data.formatStreams)) {
          info.videoStreams = data.formatStreams;
        }
        if (Array.isArray(data.captions)) {
          info.subtitles = data.captions.map(c => ({
            url: `${host}${c.url}`,
            name: c.label || c.languageCode
          }));
        }
        info.provider = `Invidious (${new URL(host).hostname})`;
        return info;
      }
    } catch (_) {}
  }

  info.provider = 'NoEmbed + Çoklu Web Çözümleyici';
  return info;
}

async function resolveViaCobalt(videoUrl, isAudioOnly = true) {
  const customUrl = document.getElementById('customApiUrlInput').value.trim();
  const candidates = customUrl ? [customUrl.replace(/\/$/, ''), ...COBALT_INSTANCES] : COBALT_INSTANCES;

  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: videoUrl,
          downloadMode: isAudioOnly ? 'audio' : 'auto',
          isAudioOnly: isAudioOnly,
          aFormat: 'mp3',
          vQuality: '720'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) return data.url;
      }
    } catch (_) {}
  }
  return null;
}

function renderYouTubeFallbackLinks(info) {
  const box = document.getElementById('ytFallbackLinks');
  box.style.display = 'block';
  const encodedUrl = encodeURIComponent(info.url);
  box.innerHTML = `
    <div style="padding:10px 12px; background:rgba(139,92,246,0.08); border:1px solid var(--border-color); border-radius:8px;">
      <strong><i class="fa-solid fa-shield-halved"></i> Alternatif Doğrudan İndirme Köprüleri (API Yoğunluğuna Karşı):</strong>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
        <a href="https://cobalt.tools/#${encodedUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
          <i class="fa-solid fa-up-right-from-square"></i> Cobalt.tools ile İndir
        </a>
        <a href="https://piped.kavin.rocks/watch?v=${info.id}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
          <i class="fa-solid fa-play"></i> Piped Stream Aç
        </a>
        <a href="https://inv.tux.pizza/watch?v=${info.id}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
          <i class="fa-solid fa-server"></i> Invidious Stream Aç
        </a>
      </div>
    </div>
  `;
}

// ==========================================
// MEDIA POOL MANAGEMENT
// ==========================================
async function addFileToPool(fileOrBlob, customName = null) {
  const name = customName || fileOrBlob.name || `medya_${Date.now()}`;
  const ext = name.split('.').pop().toLowerCase();

  // Check if subtitle file
  if (ext === 'srt' || ext === 'vtt') {
    const text = await fileOrBlob.text();
    document.getElementById('subtitleTextarea').value = text;
    showToast(`Altyazı yüklendi: ${name}`, 'success');
    return;
  }

  const isVideo = fileOrBlob.type.startsWith('video/') || ['mp4', 'webm', 'mkv', 'mov'].includes(ext);
  const type = isVideo ? 'video' : 'audio';
  const url = URL.createObjectURL(fileOrBlob);
  const id = 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

  const item = {
    id,
    name,
    type,
    blob: fileOrBlob,
    url,
    duration: 0,
    size: fileOrBlob.size
  };

  // Probe duration
  try {
    item.duration = await probeMediaDuration(url, type);
  } catch (_) {}

  state.mediaPool.push(item);
  renderMediaPool();
  selectMediaItem(id);
  showToast(`"${name}" dosyalarınıza eklendi.`, 'success');
  return item;
}

function probeMediaDuration(url, type) {
  return new Promise((resolve) => {
    const el = document.createElement(type === 'video' ? 'video' : 'audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => resolve(el.duration || 0);
    el.onerror = () => resolve(0);
    el.src = url;
  });
}

function renderMediaPool() {
  const listEl = document.getElementById('mediaList');
  const countEl = document.getElementById('mediaCountLabel');
  countEl.textContent = state.mediaPool.length;

  // Also update mux dropdowns
  updateMuxSelects();

  if (state.mediaPool.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 26px 12px; color: var(--text-dim); font-size: 0.85rem;">
        <i class="fa-solid fa-music" style="font-size: 1.5rem; margin-bottom: 8px; display:block;"></i>
        Henüz dosya yüklenmedi.<br><br>Yukarıdaki kutuya tıklayarak bilgisayarınızdan <strong>MP3 / MP4</strong> seçin veya sağ üstteki <strong>"Örnek Ses & Video Yükle"</strong> butonuna basın.
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  state.mediaPool.forEach(item => {
    const div = document.createElement('div');
    div.className = `media-item ${item.id === state.activeMediaId ? 'selected' : ''}`;
    div.innerHTML = `
      <div class="media-item-left">
        <div class="media-icon ${item.type}">
          <i class="fa-solid ${item.type === 'video' ? 'fa-film' : 'fa-music'}"></i>
        </div>
        <div class="media-meta">
          <div class="media-name" title="${item.name}">${item.name}</div>
          <div class="media-sub">${item.type === 'video' ? 'VİDEO' : 'SES'} • ${formatTime(item.duration)} • ${formatBytes(item.size)}</div>
        </div>
      </div>
      <div class="media-actions">
        <button class="icon-btn" title="İndir" data-action="download" data-id="${item.id}">
          <i class="fa-solid fa-download"></i>
        </button>
        <button class="icon-btn" title="Sil" data-action="delete" data-id="${item.id}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    div.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        e.stopPropagation();
        const act = btn.dataset.action;
        if (act === 'delete') {
          state.mediaPool = state.mediaPool.filter(m => m.id !== item.id);
          if (state.activeMediaId === item.id) {
            state.activeMediaId = state.mediaPool[0]?.id || null;
          }
          renderMediaPool();
          if (state.activeMediaId) selectMediaItem(state.activeMediaId);
        } else if (act === 'download') {
          const a = document.createElement('a');
          a.href = item.url;
          a.download = item.name;
          a.click();
        }
        return;
      }
      selectMediaItem(item.id);
    });
    listEl.appendChild(div);
  });
}

function updateMuxSelects() {
  const vidSel = document.getElementById('muxVideoSelect');
  const audSel = document.getElementById('muxAudioSelect');
  if (!vidSel || !audSel) return;

  const videos = state.mediaPool.filter(m => m.type === 'video');
  const audios = state.mediaPool.filter(m => m.type === 'audio');

  vidSel.innerHTML = videos.length
    ? videos.map(v => `<option value="${v.id}">${v.name} (${formatTime(v.duration)})</option>`).join('')
    : `<option value="">-- Önce Soldan Bir Video Yükleyin --</option>`;

  audSel.innerHTML = audios.length
    ? audios.map(a => `<option value="${a.id}">${a.name} (${formatTime(a.duration)})</option>`).join('')
    : `<option value="">-- Önce Soldan Bir MP3 Yükleyin --</option>`;
}

async function selectMediaItem(id) {
  const item = state.mediaPool.find(m => m.id === id);
  if (!item) return;
  state.activeMediaId = id;
  renderMediaPool();

  document.getElementById('activeMediaName').textContent = item.name;
  document.getElementById('activeMediaInfo').textContent =
    `${item.type === 'video' ? '🎬 Video Dosyası' : '🎵 Ses Dosyası'} • Süre: ${formatTime(item.duration)} • Boyut: ${formatBytes(item.size)}`;

  // Load into Video Player if video
  const videoEl = document.getElementById('studioVideoPlayer');
  if (item.type === 'video') {
    videoEl.src = item.url;
    document.getElementById('videoTrimStart').value = 0;
    document.getElementById('videoTrimEnd').value = Math.max(1, Number((item.duration || 10).toFixed(1)));
  }

  // Decode AudioBuffer & draw waveform (works for both Audio and Video files!)
  try {
    const audioBuffer = await getDecodedAudioBuffer(item);
    drawWaveform(audioBuffer);
    document.getElementById('audioTrimStartInput').value = 0;
    document.getElementById('audioTrimEndInput').value = Number(audioBuffer.duration.toFixed(1));
    updateAudioTrimOverlay();
  } catch (err) {
    console.warn('Ses kanalı çözümlenemedi:', err);
  }
}

async function getDecodedAudioBuffer(item) {
  if (state.audioBufferCache.has(item.id)) {
    return state.audioBufferCache.get(item.id);
  }
  const ctx = getAudioContext();
  const arrayBuf = await item.blob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuf);
  state.audioBufferCache.set(item.id, audioBuffer);
  return audioBuffer;
}

// ==========================================
// WAVEFORM RENDERER & AUDIO TRIM / EFFECTS
// ==========================================
function drawWaveform(audioBuffer) {
  const canvas = document.getElementById('waveformCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.fillStyle = '#0b0d14';
  ctx.fillRect(0, 0, w, h);

  const data = audioBuffer.getChannelData(0);
  const step = Math.ceil(data.length / w);
  const amp = h / 2;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#8b5cf6');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;

  for (let i = 0; i < w; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = data[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    const y = (1 + min) * amp;
    const height = Math.max(2, (max - min) * amp);
    ctx.fillRect(i, y, 1, height);
  }
}

function updateAudioTrimOverlay() {
  const item = state.mediaPool.find(m => m.id === state.activeMediaId);
  const buf = item ? state.audioBufferCache.get(item.id) : null;
  const total = buf ? buf.duration : (item?.duration || 1);

  let start = parseFloat(document.getElementById('audioTrimStartInput').value) || 0;
  let end = parseFloat(document.getElementById('audioTrimEndInput').value) || total;

  start = Math.max(0, Math.min(start, total));
  end = Math.max(start + 0.1, Math.min(end, total));

  const leftPct = (start / total) * 100;
  const widthPct = ((end - start) / total) * 100;

  const region = document.getElementById('audioTrimRegion');
  region.style.left = `${leftPct}%`;
  region.style.width = `${widthPct}%`;

  document.getElementById('audioStartLabel').textContent = `${start.toFixed(1)}s`;
  document.getElementById('audioEndLabel').textContent = `${end.toFixed(1)}s`;
  document.getElementById('audioDurationLabel').textContent = `${(end - start).toFixed(1)} sn`;
}

// Create synthetic reverb impulse response
function createImpulseResponse(ctx, duration = 2.2, decay = 2.0) {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function getAudioEffectParams() {
  return {
    speed: parseFloat(document.getElementById('audioSpeedRange').value) || 1.0,
    gain: (parseFloat(document.getElementById('audioGainRange').value) || 100) / 100,
    bass: parseFloat(document.getElementById('audioBassRange').value) || 0,
    reverb: (parseFloat(document.getElementById('audioReverbRange').value) || 0) / 100,
    fadeIn: parseFloat(document.getElementById('audioFadeInRange').value) || 0,
    fadeOut: parseFloat(document.getElementById('audioFadeOutRange').value) || 0
  };
}

async function renderProcessedAudioBuffer(sourceBuffer, startSec, endSec, params) {
  const clipDur = Math.max(0.1, endSec - startSec);
  const outDuration = clipDur / params.speed;
  const sampleRate = sourceBuffer.sampleRate;
  const channels = sourceBuffer.numberOfChannels;

  const offlineCtx = new OfflineAudioContext(channels, Math.ceil(outDuration * sampleRate), sampleRate);

  const src = offlineCtx.createBufferSource();
  src.buffer = sourceBuffer;
  src.playbackRate.value = params.speed;

  // Bass Boost BiquadFilter
  const bassFilter = offlineCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 120;
  bassFilter.gain.value = params.bass;

  // Master Gain + Fade In/Out Envelope
  const gainNode = offlineCtx.createGain();
  gainNode.gain.setValueAtTime(params.gain, 0);

  if (params.fadeIn > 0) {
    gainNode.gain.setValueAtTime(0.001, 0);
    gainNode.gain.linearRampToValueAtTime(params.gain, Math.min(params.fadeIn, outDuration));
  }
  if (params.fadeOut > 0 && outDuration > params.fadeOut) {
    gainNode.gain.setValueAtTime(params.gain, outDuration - params.fadeOut);
    gainNode.gain.linearRampToValueAtTime(0.001, outDuration);
  }

  src.connect(bassFilter);

  if (params.reverb > 0) {
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createImpulseResponse(offlineCtx, 2.2, 2.2);

    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - params.reverb * 0.5;
    wetGain.gain.value = params.reverb;

    bassFilter.connect(dryGain);
    dryGain.connect(gainNode);

    bassFilter.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(gainNode);
  } else {
    bassFilter.connect(gainNode);
  }

  gainNode.connect(offlineCtx.destination);
  src.start(0, startSec, clipDur);

  return await offlineCtx.startRendering();
}

// ==========================================
// MP3 (LameJS) & WAV ENCODERS
// ==========================================
function encodeAudioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

async function encodeAudioBufferToMp3(audioBuffer, kbps = 192, onProgress = null) {
  if (typeof lamejs === 'undefined') {
    showToast('LameJS bulunamadı, WAV olarak dışa aktarılıyor.', 'warning');
    return encodeAudioBufferToWav(audioBuffer);
  }

  const channels = audioBuffer.numberOfChannels >= 2 ? 2 : 1;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data = [];

  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels === 2 ? audioBuffer.getChannelData(1) : leftFloat;

  const sampleBlockSize = 1152;
  const totalSamples = leftFloat.length;

  const floatTo16Bit = (arr, start, len) => {
    const int16 = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, arr[start + i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  };

  for (let i = 0; i < totalSamples; i += sampleBlockSize) {
    const chunkLen = Math.min(sampleBlockSize, totalSamples - i);
    const leftChunk = floatTo16Bit(leftFloat, i, chunkLen);
    let mp3buf;
    if (channels === 2) {
      const rightChunk = floatTo16Bit(rightFloat, i, chunkLen);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    if (onProgress && i % (sampleBlockSize * 40) === 0) {
      onProgress((i / totalSamples) * 100);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(endBuf);
  }

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}

// ==========================================
// GIF ENCODER (Pure JS Animated GIF89a Builder)
// ==========================================
function encodeFramesToAnimatedGif(canvases, delayMs = 80) {
  const width = canvases[0].width;
  const height = canvases[0].height;
  const bytes = [];

  const writeByte = b => bytes.push(b & 0xff);
  const writeShort = s => { writeByte(s); writeByte(s >> 8); };
  const writeStr = str => { for (let i = 0; i < str.length; i++) writeByte(str.charCodeAt(i)); };

  // Header
  writeStr('GIF89a');
  writeShort(width);
  writeShort(height);
  writeByte(0xf7); // Global color table, 256 colors
  writeByte(0);
  writeByte(0);

  // Build 256 color table (6x6x6 web cube = 216 + 40 grays)
  for (let i = 0; i < 256; i++) {
    if (i < 216) {
      const r = Math.floor(i / 36) * 51;
      const g = (Math.floor(i / 6) % 6) * 51;
      const b = (i % 6) * 51;
      writeByte(r); writeByte(g); writeByte(b);
    } else {
      const gray = Math.floor(((i - 216) / 40) * 255);
      writeByte(gray); writeByte(gray); writeByte(gray);
    }
  }

  // Netscape Loop Extension
  writeByte(0x21); writeByte(0xff); writeByte(11);
  writeStr('NETSCAPE2.0');
  writeByte(3); writeByte(1); writeShort(0); writeByte(0);

  const delayCs = Math.max(2, Math.round(delayMs / 10));

  for (const canvas of canvases) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height).data;

    // Graphic Control Extension
    writeByte(0x21); writeByte(0xf9); writeByte(4);
    writeByte(0x00);
    writeShort(delayCs);
    writeByte(0);
    writeByte(0);

    // Image Descriptor
    writeByte(0x2c);
    writeShort(0); writeShort(0);
    writeShort(width); writeShort(height);
    writeByte(0);

    // LZW Minimum Code Size = 8
    writeByte(8);
    const clearCode = 256;
    const endCode = 257;

    let bitBuf = 0;
    let bitCnt = 0;
    const subBlock = [];

    const flushSubBlock = () => {
      if (subBlock.length > 0) {
        writeByte(subBlock.length);
        for (let i = 0; i < subBlock.length; i++) writeByte(subBlock[i]);
        subBlock.length = 0;
      }
    };

    const emitCode9 = (code) => {
      bitBuf |= (code << bitCnt);
      bitCnt += 9;
      while (bitCnt >= 8) {
        subBlock.push(bitBuf & 0xff);
        if (subBlock.length === 255) flushSubBlock();
        bitBuf >>= 8;
        bitCnt -= 8;
      }
    };

    emitCode9(clearCode);
    let countSinceClear = 0;
    const totalPixels = width * height;
    for (let p = 0; p < totalPixels; p++) {
      const r = Math.round((imgData[p * 4] / 255) * 5);
      const g = Math.round((imgData[p * 4 + 1] / 255) * 5);
      const b = Math.round((imgData[p * 4 + 2] / 255) * 5);
      const colorIdx = r * 36 + g * 6 + b;
      emitCode9(colorIdx);
      countSinceClear++;
      if (countSinceClear === 250) {
        emitCode9(clearCode);
        countSinceClear = 0;
      }
    }
    emitCode9(endCode);
    if (bitCnt > 0) {
      subBlock.push(bitBuf & 0xff);
    }
    flushSubBlock();
    writeByte(0); // Block terminator
  }

  writeByte(0x3b); // Trailer
  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
}

// ==========================================
// SUBTITLE PARSER (.SRT / .VTT)
// ==========================================
function parseSubtitles(text) {
  if (!text || !text.trim()) return [];
  const cues = [];
  const blocks = text.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);

  const parseTime = (tStr) => {
    const parts = tStr.trim().replace(',', '.').split(':');
    if (parts.length === 3) {
      return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    }
    if (parts.length === 2) {
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
  };

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const arrowLineIdx = lines.findIndex(l => l.includes('-->'));
    if (arrowLineIdx !== -1) {
      const [startStr, endStr] = lines[arrowLineIdx].split('-->');
      const start = parseTime(startStr);
      const end = parseTime(endStr);
      const cueText = lines.slice(arrowLineIdx + 1).join('\n');
      if (cueText) cues.push({ start, end, text: cueText });
    }
  }
  return cues;
}

// ==========================================
// VIDEO PROCESSING ENGINE (CANVAS + MEDIARECORDER)
// ==========================================
function getSupportedVideoMime() {
  const types = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const t of types) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'video/webm';
}

async function processVideoPipeline({
  videoItem,
  startSec,
  endSec,
  aspect = 'original',
  scale = 1,
  bitrate = 3500000,
  speed = 1.0,
  watermarkText = '',
  watermarkPos = 'bottom-right',
  subtitles = [],
  muteOriginal = false,
  externalAudioItem = null,
  origAudioVolume = 1.0
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.src = videoItem.url;
      video.crossOrigin = 'anonymous';
      video.muted = false;
      video.playsInline = true;

      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error('Video yüklenemedi'));
      });

      const srcW = video.videoWidth || 1280;
      const srcH = video.videoHeight || 720;

      // Calculate Crop Box
      let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
      if (aspect !== 'original') {
        const [aw, ah] = aspect.split(':').map(Number);
        const targetRatio = aw / ah;
        const currentRatio = srcW / srcH;
        if (currentRatio > targetRatio) {
          cropW = Math.round(srcH * targetRatio);
          cropX = Math.round((srcW - cropW) / 2);
        } else {
          cropH = Math.round(srcW / targetRatio);
          cropY = Math.round((srcH - cropH) / 2);
        }
      }

      const outW = Math.max(160, Math.round((cropW * scale) / 2) * 2);
      const outH = Math.max(160, Math.round((cropH * scale) / 2) * 2);

      const canvas = document.getElementById('videoProcessCanvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');

      // Setup Audio Graph for Recording
      const audioCtx = getAudioContext();
      const destNode = audioCtx.createMediaStreamDestination();

      if (!muteOriginal && origAudioVolume > 0) {
        const vidSource = audioCtx.createMediaElementSource(video);
        const vidGain = audioCtx.createGain();
        vidGain.gain.value = origAudioVolume;
        vidSource.connect(vidGain);
        vidGain.connect(destNode);
      } else {
        video.muted = true;
      }

      let extAudioSource = null;
      if (externalAudioItem) {
        const extBuf = await getDecodedAudioBuffer(externalAudioItem);
        extAudioSource = audioCtx.createBufferSource();
        extAudioSource.buffer = extBuf;
        extAudioSource.connect(destNode);
      }

      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...(muteOriginal && !externalAudioItem ? [] : destNode.stream.getAudioTracks())
      ];
      const finalStream = new MediaStream(combinedTracks);

      const mimeType = getSupportedVideoMime();
      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: bitrate
      });

      const chunks = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const outBlob = new Blob(chunks, { type: mimeType });
        resolve({ blob: outBlob, ext });
      };

      const sTime = Math.max(0, startSec);
      const eTime = Math.min(video.duration || endSec, endSec);
      const totalDur = Math.max(0.2, eTime - sTime);

      video.currentTime = sTime;
      video.playbackRate = speed;

      await new Promise(r => { video.onseeked = r; });

      recorder.start(100);
      if (extAudioSource) extAudioSource.start(0);
      await video.play();

      const renderFrame = () => {
        if (video.paused || video.ended || video.currentTime >= eTime) {
          video.pause();
          if (extAudioSource) {
            try { extAudioSource.stop(); } catch (_) {}
          }
          if (recorder.state === 'recording') recorder.stop();
          setProgress(false);
          return;
        }

        // Draw cropped video frame
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

        // Draw Watermark if specified
        if (watermarkText) {
          ctx.save();
          const fontSize = Math.max(16, Math.round(outH * 0.04));
          ctx.font = `700 ${fontSize}px Inter, sans-serif`;
          const pad = 20;
          const textWidth = ctx.measureText(watermarkText).width;
          let wx = outW - textWidth - pad;
          let wy = outH - pad;
          if (watermarkPos === 'top-right') { wx = outW - textWidth - pad; wy = fontSize + pad; }
          else if (watermarkPos === 'top-left') { wx = pad; wy = fontSize + pad; }
          else if (watermarkPos === 'bottom-left') { wx = pad; wy = outH - pad; }
          else if (watermarkPos === 'center') { wx = (outW - textWidth) / 2; wy = outH / 2; }

          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(wx - 8, wy - fontSize, textWidth + 16, fontSize + 10);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.fillText(watermarkText, wx, wy);
          ctx.restore();
        }

        // Draw burned-in Subtitles if matching current timestamp
        if (subtitles.length > 0) {
          const cur = video.currentTime;
          const activeCue = subtitles.find(c => cur >= c.start && cur <= c.end);
          if (activeCue) {
            ctx.save();
            const subFontSize = Math.max(18, Math.round(outH * 0.048));
            ctx.font = `700 ${subFontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            const lines = activeCue.text.split('\n');
            lines.forEach((line, idx) => {
              const ly = outH - 45 - (lines.length - 1 - idx) * (subFontSize + 8);
              ctx.lineWidth = 5;
              ctx.strokeStyle = 'rgba(0,0,0,0.9)';
              ctx.strokeText(line, outW / 2, ly);
              ctx.fillStyle = '#fde047';
              ctx.fillText(line, outW / 2, ly);
            });
            ctx.restore();
          }
        }

        const pct = ((video.currentTime - sTime) / totalDur) * 100;
        setProgress(true, 'Video işleniyor ve kodlanıyor...', pct);
        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);
    } catch (err) {
      setProgress(false);
      reject(err);
    }
  });
}

// ==========================================
// SAMPLE DEMO MEDIA GENERATOR (Zero External Dependency)
// ==========================================
async function generateSampleMedia() {
  setProgress(true, 'Örnek MP3 müzik ve HD demo video oluşturuluyor...', 25);

  // 1. Create a 6-second melodic synth stereo AudioBuffer
  const ctx = getAudioContext();
  const sr = 44100;
  const dur = 6;
  const buf = ctx.createBuffer(2, sr * dur, sr);
  const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C major arpeggio

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const t = i / sr;
      const noteIdx = Math.floor(t) % notes.length;
      const freq = notes[noteIdx] * (ch === 1 ? 1.003 : 1);
      const env = Math.exp(-((t % 1) * 3.2));
      const bass = Math.sin(2 * Math.PI * (freq / 2) * t) * 0.35;
      const lead = Math.sin(2 * Math.PI * freq * t) * 0.45 * env;
      data[i] = Math.max(-0.95, Math.min(0.95, bass + lead));
    }
  }

  const mp3Blob = await encodeAudioBufferToMp3(buf, 192);
  await addFileToPool(mp3Blob, 'ornek_muzik.mp3');

  setProgress(true, 'Örnek 720p animasyonlu video üretiliyor...', 65);

  // 2. Create a 3.5-second animated demo video with audio
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const cctx = canvas.getContext('2d');

  const stream = canvas.captureStream(30);
  const dest = ctx.createMediaStreamDestination();
  const srcNode = ctx.createBufferSource();
  srcNode.buffer = buf;
  srcNode.connect(dest);

  const combined = new MediaStream([
    ...stream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  const mime = getSupportedVideoMime();
  const rec = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 2500000 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  await new Promise(resolve => {
    rec.onstop = resolve;
    rec.start(100);
    srcNode.start(0);
    const startT = performance.now();

    const drawDemo = (now) => {
      const elapsed = (now - startT) / 1000;
      if (elapsed >= 3.5) {
        srcNode.stop();
        rec.stop();
        return;
      }
      // Animated neon background
      const grad = cctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#4c1d95');
      grad.addColorStop(1, '#0f172a');
      cctx.fillStyle = grad;
      cctx.fillRect(0, 0, 640, 360);

      // Moving circles
      const cx = 320 + Math.cos(elapsed * 2.5) * 140;
      const cy = 180 + Math.sin(elapsed * 3.5) * 70;
      cctx.beginPath();
      cctx.arc(cx, cy, 48, 0, Math.PI * 2);
      cctx.fillStyle = '#ec4899';
      cctx.fill();

      cctx.fillStyle = '#ffffff';
      cctx.font = '700 26px Inter, sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('Örnek Test Videosu', 320, 175);
      cctx.font = '500 16px Inter, sans-serif';
      cctx.fillStyle = '#38bdf8';
      cctx.fillText(`Süre: ${elapsed.toFixed(2)} sn • Kırpma & GIF Testi`, 320, 210);

      requestAnimationFrame(drawDemo);
    };
    requestAnimationFrame(drawDemo);
  });

  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const vidBlob = new Blob(chunks, { type: mime });
  await addFileToPool(vidBlob, `ornek_video.${ext}`);

  setProgress(false);
  showToast('Örnek MP3 ve Video yüklendi! İstediğiniz aracı hemen deneyebilirsiniz.', 'success');
}

// ==========================================
// AUDIO VISUALIZER (MP3 -> MP4/WEBM)
// ==========================================
function drawVisualizerFrame(canvas, analyser, style, titleText, bgImg) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, w, h);
    ctx.fillStyle = 'rgba(9, 11, 16, 0.65)';
    ctx.fillRect(0, 0, w, h);
  } else {
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(1, '#090b10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  if (style === 'wave') {
    analyser.getByteTimeDomainData(dataArray);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    const sliceWidth = w / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  } else if (style === 'circle') {
    analyser.getByteFrequencyData(dataArray);
    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = 85;
    const bars = 90;
    for (let i = 0; i < bars; i++) {
      const val = dataArray[i];
      const rad = (i / bars) * Math.PI * 2;
      const barLen = (val / 255) * 110;
      const x1 = cx + Math.cos(rad) * baseRadius;
      const y1 = cy + Math.sin(rad) * baseRadius;
      const x2 = cx + Math.cos(rad) * (baseRadius + barLen);
      const y2 = cy + Math.sin(rad) * (baseRadius + barLen);
      ctx.strokeStyle = `hsl(${(i / bars) * 320 + 200}, 90%, 60%)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else {
    // Spectrum Bars
    analyser.getByteFrequencyData(dataArray);
    const barCount = 64;
    const barWidth = (w - 80) / barCount;
    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i];
      const barHeight = (val / 255) * (h * 0.62);
      const x = 40 + i * barWidth;
      const y = h - 50 - barHeight;
      const grad = ctx.createLinearGradient(0, y, 0, h - 50);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth - 4, barHeight);
    }
  }

  // Title overlay
  if (titleText) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, w / 2, 52);
  }
}

// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Draw idle visualizer welcome screen
  const vizCanvas = document.getElementById('vizCanvas');
  if (vizCanvas) {
    const vctx = vizCanvas.getContext('2d');
    vctx.fillStyle = '#0c0f17';
    vctx.fillRect(0, 0, vizCanvas.width, vizCanvas.height);
    vctx.fillStyle = '#94a3b8';
    vctx.font = '600 18px Inter, sans-serif';
    vctx.textAlign = 'center';
    vctx.fillText('Soldan bir MP3 seçip "Önizlemeyi Başlat" veya "MP3\'ten Video Oluştur" butonuna tıklayın', vizCanvas.width / 2, vizCanvas.height / 2);
  }

  // Toggle API Drawer
  document.getElementById('toggleApiSettingsBtn').addEventListener('click', () => {
    document.getElementById('apiDrawer').classList.toggle('open');
  });

  // Load FFmpeg.wasm on demand
  document.getElementById('loadFfmpegBtn').addEventListener('click', async () => {
    const badge = document.getElementById('engineStatusBadge');
    const text = document.getElementById('engineStatusText');
    badge.classList.add('loading');
    text.textContent = 'FFmpeg.wasm Yükleniyor...';
    showToast('FFmpeg.wasm CDN üzerinden indiriliyor...', 'info');
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.min.js';
      document.head.appendChild(script);
      await new Promise((res, rej) => {
        script.onload = res;
        script.onerror = rej;
      });
      badge.classList.remove('loading');
      text.textContent = 'FFmpeg.wasm + WebAudio Hazır';
      showToast('FFmpeg.wasm kütüphanesi başarıyla yüklendi!', 'success');
    } catch (e) {
      badge.classList.remove('loading');
      text.textContent = 'Tarayıcı Motoru Hazır';
      showToast('Yerel WebAudio & LameMP3 motoru aktif.', 'info');
    }
  });

  // Generate Demo Media Button
  document.getElementById('loadSampleBtn').addEventListener('click', () => {
    generateSampleMedia();
  });

  // YouTube Analyze Button
  const analyzeYouTube = async () => {
    const rawUrl = document.getElementById('ytUrlInput').value;
    const vidId = extractYouTubeId(rawUrl);
    if (!vidId) {
      showToast('Lütfen geçerli bir YouTube video veya Shorts linki girin.', 'error');
      return null;
    }

    setProgress(true, 'YouTube video bilgileri getiriliyor...', 40);
    const info = await fetchYouTubeMetadata(vidId);
    state.currentYtInfo = info;
    setProgress(false);

    const card = document.getElementById('ytPreviewCard');
    card.classList.add('active');
    document.getElementById('ytThumbImg').src = info.thumb;
    document.getElementById('ytTitleText').textContent = info.title;
    document.getElementById('ytAuthorText').textContent = info.author;
    document.getElementById('ytIdText').textContent = info.id;
    document.getElementById('ytDurationBadge').textContent = info.duration ? formatTime(info.duration) : 'HD';
    document.getElementById('ytApiStatusText').innerHTML = `<i class="fa-solid fa-bolt"></i> ${info.provider}`;

    renderYouTubeFallbackLinks(info);
    showToast(`Video bulundu: ${info.title}`, 'success');
    return info;
  };

  document.getElementById('ytAnalyzeBtn').addEventListener('click', analyzeYouTube);

  // Direct Download Button
  document.getElementById('ytDirectDownloadBtn').addEventListener('click', async () => {
    let info = state.currentYtInfo;
    const currentInputId = extractYouTubeId(document.getElementById('ytUrlInput').value);
    if (!info || info.id !== currentInputId) {
      info = await analyzeYouTube();
    }
    if (!info) return;

    const fmt = document.getElementById('ytFormatSelect').value;
    const isAudio = fmt === 'mp3';
    await triggerYouTubeDownload(info, isAudio, false);
  });

  document.getElementById('ytDownloadMp3Btn').addEventListener('click', () => {
    if (state.currentYtInfo) triggerYouTubeDownload(state.currentYtInfo, true, false);
  });

  document.getElementById('ytDownloadMp4Btn').addEventListener('click', () => {
    if (state.currentYtInfo) triggerYouTubeDownload(state.currentYtInfo, false, false);
  });

  document.getElementById('ytImportStudioBtn').addEventListener('click', () => {
    if (state.currentYtInfo) triggerYouTubeDownload(state.currentYtInfo, true, true);
  });

  // Download HD Thumbnail
  document.getElementById('ytDownloadThumbBtn').addEventListener('click', async () => {
    if (!state.currentYtInfo) return;
    const maxResUrl = `https://i.ytimg.com/vi/${state.currentYtInfo.id}/maxresdefault.jpg`;
    window.open(maxResUrl, '_blank');
    showToast('HD kapak resmi yeni sekmede açıldı.', 'success');
  });

  // Fetch Subtitles from YouTube
  document.getElementById('ytFetchSubtitlesBtn').addEventListener('click', async () => {
    const info = state.currentYtInfo;
    if (!info) return;
    if (info.subtitles && info.subtitles.length > 0) {
      try {
        const subUrl = info.subtitles[0].url;
        const res = await fetch(subUrl);
        const text = await res.text();
        document.getElementById('subtitleTextarea').value = text;
        showToast('YouTube altyazısı Video Kırp > Altyazı sekmesine aktarıldı!', 'success');
        return;
      } catch (_) {}
    }
    const sampleSrt = `1\n00:00:00,500 --> 00:00:03,500\n${info.title}\n\n2\n00:00:03,800 --> 00:00:07,000\nKanal: ${info.author}`;
    document.getElementById('subtitleTextarea').value = sampleSrt;
    showToast('Altyazı şablonu oluşturuldu ve Altyazı sekmesine eklendi.', 'info');
  });

  // Studio Main Tab Switching
  document.querySelectorAll('.studio-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.studio-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.studioTab).classList.add('active');
    });
  });

  // Audio Subtool Switching
  document.querySelectorAll('[data-audio-pane]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-audio-pane]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#audioStudio .tool-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.audioPane).classList.add('active');
    });
  });

  // Video Subtool Switching
  document.querySelectorAll('[data-video-pane]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-video-pane]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#videoStudio .tool-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.videoPane).classList.add('active');
    });
  });

  // Dropzone & File Upload
  const dropzone = document.getElementById('fileDropzone');
  const fileInput = document.getElementById('fileInput');
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', async e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) await addFileToPool(f);
  });
  fileInput.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    for (const f of files) await addFileToPool(f);
    fileInput.value = '';
  });

  document.getElementById('clearPoolBtn').addEventListener('click', () => {
    state.mediaPool = [];
    state.activeMediaId = null;
    renderMediaPool();
    showToast('Yüklü dosyalar temizlendi.', 'info');
  });

  // Interactive Waveform Click-Drag Selection
  const wfContainer = document.getElementById('waveformContainer');
  let isDraggingWf = false;
  let dragStartSec = 0;

  wfContainer.addEventListener('mousedown', e => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    const buf = item ? state.audioBufferCache.get(item.id) : null;
    if (!buf) return;
    isDraggingWf = true;
    const rect = wfContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dragStartSec = ratio * buf.duration;
    document.getElementById('audioTrimStartInput').value = dragStartSec.toFixed(1);
    updateAudioTrimOverlay();
  });

  window.addEventListener('mousemove', e => {
    if (!isDraggingWf) return;
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    const buf = item ? state.audioBufferCache.get(item.id) : null;
    if (!buf) return;
    const rect = wfContainer.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const curSec = ratio * buf.duration;
    const s = Math.min(dragStartSec, curSec);
    const end = Math.max(dragStartSec + 0.2, curSec);
    document.getElementById('audioTrimStartInput').value = s.toFixed(1);
    document.getElementById('audioTrimEndInput').value = end.toFixed(1);
    updateAudioTrimOverlay();
  });

  window.addEventListener('mouseup', () => { isDraggingWf = false; });

  document.getElementById('audioTrimStartInput').addEventListener('input', updateAudioTrimOverlay);
  document.getElementById('audioTrimEndInput').addEventListener('input', updateAudioTrimOverlay);

  // Audio Effect Sliders UI Updates
  const bindSlider = (id, valId, fmt) => {
    const el = document.getElementById(id);
    const vEl = document.getElementById(valId);
    el.addEventListener('input', () => { vEl.textContent = fmt(el.value); });
  };
  bindSlider('audioSpeedRange', 'audioSpeedVal', v => `${parseFloat(v).toFixed(2)}x`);
  bindSlider('audioGainRange', 'audioGainVal', v => `${v}%`);
  bindSlider('audioBassRange', 'audioBassVal', v => `${v} dB`);
  bindSlider('audioReverbRange', 'audioReverbVal', v => `${v}%`);
  bindSlider('audioFadeInRange', 'audioFadeInVal', v => `${parseFloat(v).toFixed(1)} sn`);
  bindSlider('audioFadeOutRange', 'audioFadeOutVal', v => `${parseFloat(v).toFixed(1)} sn`);
  bindSlider('videoSpeedRange', 'videoSpeedVal', v => `${parseFloat(v).toFixed(2)}x`);
  bindSlider('muxOrigVolRange', 'muxOrigVolVal', v => v == 0 ? '0% (Tamamen Kapat)' : `${v}%`);

  // Audio Preset Chips
  document.querySelectorAll('[data-audio-preset]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-audio-preset]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const p = chip.dataset.audioPreset;
      const setVals = (speed, gain, bass, rev) => {
        document.getElementById('audioSpeedRange').value = speed;
        document.getElementById('audioGainRange').value = gain;
        document.getElementById('audioBassRange').value = bass;
        document.getElementById('audioReverbRange').value = rev;
        document.getElementById('audioSpeedRange').dispatchEvent(new Event('input'));
        document.getElementById('audioGainRange').dispatchEvent(new Event('input'));
        document.getElementById('audioBassRange').dispatchEvent(new Event('input'));
        document.getElementById('audioReverbRange').dispatchEvent(new Event('input'));
      };
      if (p === 'normal') setVals(1.0, 100, 0, 0);
      else if (p === 'slowed') setVals(0.85, 105, 4, 45);
      else if (p === 'nightcore') setVals(1.25, 100, 2, 10);
      else if (p === 'bassboost') setVals(1.0, 110, 12, 0);
      else if (p === 'podcast') setVals(1.0, 135, 3, 0);
    });
  });

  // Audio Live Preview
  document.getElementById('audioPlayPreviewBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    if (!item) return showToast('Önce soldan bir dosya seçin veya "Örnek Ses & Video Yükle" butonuna tıklayın.', 'warning');
    if (state.previewSource) {
      try { state.previewSource.stop(); } catch (_) {}
    }
    const buf = await getDecodedAudioBuffer(item);
    const s = parseFloat(document.getElementById('audioTrimStartInput').value) || 0;
    const e = parseFloat(document.getElementById('audioTrimEndInput').value) || buf.duration;
    const rendered = await renderProcessedAudioBuffer(buf, s, e, getAudioEffectParams());

    const ctx = getAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = rendered;
    src.connect(ctx.destination);
    src.start(0);
    state.previewSource = src;
  });

  document.getElementById('audioStopPreviewBtn').addEventListener('click', () => {
    if (state.previewSource) {
      try { state.previewSource.stop(); } catch (_) {}
      state.previewSource = null;
    }
  });

  // Export Trimmed + Effected Audio (MP3 / WAV)
  document.getElementById('exportAudioBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    if (!item) return showToast('Lütfen önce sol taraftan bir ses veya video seçin.', 'warning');

    setProgress(true, 'Ses kesiliyor ve hazırlanıyor...', 15);
    const buf = await getDecodedAudioBuffer(item);
    const s = parseFloat(document.getElementById('audioTrimStartInput').value) || 0;
    const e = parseFloat(document.getElementById('audioTrimEndInput').value) || buf.duration;
    const rendered = await renderProcessedAudioBuffer(buf, s, e, getAudioEffectParams());

    const fmt = document.getElementById('audioExportFormat').value;
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    let outBlob, outName;

    if (fmt === 'wav') {
      setProgress(true, 'WAV dosyası oluşturuluyor...', 80);
      outBlob = encodeAudioBufferToWav(rendered);
      outName = `${baseName}_kesildi.wav`;
    } else {
      const kbps = parseInt(fmt.split('-')[1], 10) || 192;
      outBlob = await encodeAudioBufferToMp3(rendered, kbps, pct => {
        setProgress(true, `MP3 (${kbps} kbps) oluşturuluyor...`, pct);
      });
      outName = `${baseName}_kesildi.mp3`;
    }

    setProgress(false);
    showOutputResult(outBlob, outName, 'Ses Başarıyla Kesildi ve Hazırlandı!');
    showToast(`${outName} hazır!`, 'success');
  });

  // Audio Merge Queue
  const renderAudioMergeList = () => {
    const container = document.getElementById('audioMergeList');
    if (state.audioMergeQueue.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:0.85rem; padding:18px;">Henüz ses eklenmedi. Soldan bir ses seçip <strong>"+ Seçili Sesi Sıraya Ekle"</strong> butonuna tıklayın.</div>`;
      return;
    }
    container.innerHTML = '';
    state.audioMergeQueue.forEach((mId, idx) => {
      const m = state.mediaPool.find(x => x.id === mId);
      if (!m) return;
      const row = document.createElement('div');
      row.className = 'merge-item';
      row.innerHTML = `
        <span><strong>#${idx + 1}</strong> ${m.name} (${formatTime(m.duration)})</span>
        <button class="icon-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        state.audioMergeQueue.splice(idx, 1);
        renderAudioMergeList();
      });
      container.appendChild(row);
    });
  };

  document.getElementById('addActiveToAudioMergeBtn').addEventListener('click', () => {
    if (!state.activeMediaId) return showToast('Önce soldaki Dosyalarım listesinden bir ses seçin.', 'warning');
    state.audioMergeQueue.push(state.activeMediaId);
    renderAudioMergeList();
  });

  document.getElementById('mergeAudioExecuteBtn').addEventListener('click', async () => {
    if (state.audioMergeQueue.length < 2) {
      return showToast('Birleştirmek için listeye en az 2 ses ekleyin.', 'warning');
    }
    setProgress(true, 'Ses dosyaları birleştiriliyor...', 20);
    const buffers = [];
    for (const id of state.audioMergeQueue) {
      const m = state.mediaPool.find(x => x.id === id);
      if (m) buffers.push(await getDecodedAudioBuffer(m));
    }
    const crossfadeSec = parseFloat(document.getElementById('audioCrossfadeSelect').value) || 0;
    const sr = 44100;
    const totalLength = buffers.reduce((acc, b, idx) => {
      const len = Math.floor(b.duration * sr);
      return idx === 0 ? len : acc + len - Math.floor(crossfadeSec * sr);
    }, 0);

    const offline = new OfflineAudioContext(2, Math.max(sr, totalLength), sr);
    let offset = 0;
    for (const b of buffers) {
      const src = offline.createBufferSource();
      src.buffer = b;
      const gain = offline.createGain();
      if (crossfadeSec > 0 && offset > 0) {
        gain.gain.setValueAtTime(0, offset);
        gain.gain.linearRampToValueAtTime(1, offset + crossfadeSec);
      }
      src.connect(gain);
      gain.connect(offline.destination);
      src.start(offset);
      offset += Math.max(0.1, b.duration - crossfadeSec);
    }

    const mergedBuf = await offline.startRendering();
    const mp3Blob = await encodeAudioBufferToMp3(mergedBuf, 192, pct => {
      setProgress(true, 'Birleştirilmiş MP3 hazırlanıyor...', pct);
    });
    setProgress(false);
    showOutputResult(mp3Blob, 'birlestirilmis_ses.mp3', 'Sesler Başarıyla Birleştirildi!');
  });

  // ==========================================
  // VIDEO STUDIO CONTROLS
  // ==========================================
  const studioVideo = document.getElementById('studioVideoPlayer');
  document.getElementById('setVidStartCurrentBtn').addEventListener('click', () => {
    document.getElementById('videoTrimStart').value = studioVideo.currentTime.toFixed(1);
  });
  document.getElementById('setVidEndCurrentBtn').addEventListener('click', () => {
    document.getElementById('videoTrimEnd').value = studioVideo.currentTime.toFixed(1);
  });

  // Quick PNG Frame Capture
  document.getElementById('captureQuickFrameBtn').addEventListener('click', () => {
    if (!studioVideo.src || !studioVideo.videoWidth) {
      return showToast('Önce soldan bir video seçin.', 'warning');
    }
    const c = document.createElement('canvas');
    c.width = studioVideo.videoWidth;
    c.height = studioVideo.videoHeight;
    c.getContext('2d').drawImage(studioVideo, 0, 0);
    c.toBlob(blob => {
      showOutputResult(blob, `ekran_goruntusu_${formatTime(studioVideo.currentTime).replace(':', '-')}.png`, 'Fotoğraf (Kare) Yakalandı!');
    }, 'image/png');
  });

  // Video Trim / Crop / Compress Button
  document.getElementById('processVideoTrimBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Lütfen önce sol taraftan bir video seçin.', 'warning');

    const startSec = parseFloat(document.getElementById('videoTrimStart').value) || 0;
    const endSec = parseFloat(document.getElementById('videoTrimEnd').value) || item.duration || 10;
    const aspect = document.getElementById('videoAspectSelect').value;
    const scale = parseFloat(document.getElementById('videoScaleSelect').value) || 1;
    const speed = parseFloat(document.getElementById('videoSpeedRange').value) || 1.0;
    const comp = document.getElementById('videoCompressSelect').value;
    const bitrates = { high: 8000000, medium: 3500000, discord: 1500000, low: 800000 };

    const { blob, ext } = await processVideoPipeline({
      videoItem: item,
      startSec,
      endSec,
      aspect,
      scale,
      bitrate: bitrates[comp] || 3500000,
      speed
    });

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    showOutputResult(blob, `${baseName}_kirpildi.${ext}`, 'Video Başarıyla Kesildi ve Hazırlandı!');
  });

  // Subtitle file load & Burn-in
  document.getElementById('subtitleFileInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (f) {
      document.getElementById('subtitleTextarea').value = await f.text();
      showToast('Altyazı dosyası metin kutusuna aktarıldı.', 'success');
    }
  });

  document.getElementById('downloadSrtBtn').addEventListener('click', () => {
    const txt = document.getElementById('subtitleTextarea').value;
    if (!txt.trim()) return showToast('Altyazı alanı boş.', 'warning');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    showOutputResult(blob, 'altyazi.srt', 'Altyazı (.SRT) Hazır!');
  });

  document.getElementById('burnSubWatermarkBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Lütfen sol taraftan bir video seçin.', 'warning');

    const startSec = parseFloat(document.getElementById('videoTrimStart').value) || 0;
    const endSec = parseFloat(document.getElementById('videoTrimEnd').value) || item.duration || 10;
    const watermarkText = document.getElementById('watermarkTextInput').value.trim();
    const watermarkPos = document.getElementById('watermarkPosSelect').value;
    const subtitles = parseSubtitles(document.getElementById('subtitleTextarea').value);

    const { blob, ext } = await processVideoPipeline({
      videoItem: item,
      startSec,
      endSec,
      watermarkText,
      watermarkPos,
      subtitles
    });

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    showOutputResult(blob, `${baseName}_altyazili.${ext}`, 'Altyazı ve Yazı Videoya İşlendi!');
  });

  // Animated GIF Generator & Burst Frames
  document.getElementById('createGifBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Lütfen önce bir video seçin.', 'warning');

    const startSec = parseFloat(document.getElementById('videoTrimStart').value) || 0;
    const endSec = Math.min(startSec + 6, parseFloat(document.getElementById('videoTrimEnd').value) || 4);
    const gifW = parseInt(document.getElementById('gifWidthSelect').value, 10) || 480;
    const fps = parseInt(document.getElementById('gifFpsSelect').value, 10) || 10;

    const tempVid = document.createElement('video');
    tempVid.src = item.url;
    tempVid.muted = true;
    await new Promise(r => { tempVid.onloadedmetadata = r; });

    const ratio = (tempVid.videoHeight || 360) / (tempVid.videoWidth || 640);
    const gifH = Math.round(gifW * ratio);

    const frames = [];
    const step = 1 / fps;
    for (let t = startSec; t < endSec; t += step) {
      setProgress(true, 'GIF kareleri yakalanıyor...', ((t - startSec) / (endSec - startSec)) * 85);
      tempVid.currentTime = t;
      await new Promise(r => { tempVid.onseeked = r; });
      const c = document.createElement('canvas');
      c.width = gifW;
      c.height = gifH;
      c.getContext('2d').drawImage(tempVid, 0, 0, gifW, gifH);
      frames.push(c);
    }

    if (frames.length === 0) {
      setProgress(false);
      return showToast('Kare yakalanamadı.', 'error');
    }

    setProgress(true, 'Hareketli GIF oluşturuluyor...', 95);
    const gifBlob = encodeFramesToAnimatedGif(frames, Math.round(1000 / fps));
    setProgress(false);
    showOutputResult(gifBlob, 'animasyon.gif', 'Hareketli GIF Oluşturuldu!');
  });

  document.getElementById('burstFramesBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Lütfen önce bir video seçin.', 'warning');

    const gallery = document.getElementById('capturedFramesGallery');
    gallery.innerHTML = '';

    const tempVid = document.createElement('video');
    tempVid.src = item.url;
    tempVid.muted = true;
    await new Promise(r => { tempVid.onloadedmetadata = r; });

    const dur = tempVid.duration || 6;
    for (let i = 1; i <= 6; i++) {
      const t = (dur / 7) * i;
      tempVid.currentTime = t;
      await new Promise(r => { tempVid.onseeked = r; });
      const c = document.createElement('canvas');
      c.width = tempVid.videoWidth || 640;
      c.height = tempVid.videoHeight || 360;
      c.getContext('2d').drawImage(tempVid, 0, 0);
      const dataUrl = c.toDataURL('image/png');

      const card = document.createElement('div');
      card.className = 'frame-card';
      card.innerHTML = `
        <img src="${dataUrl}" alt="Frame" />
        <a href="${dataUrl}" download="kare_${i}_${t.toFixed(1)}s.png" class="btn btn-outline btn-sm" style="width:100%;">
          <i class="fa-solid fa-download"></i> ${t.toFixed(1)}s İndir
        </a>
      `;
      gallery.appendChild(card);
    }
    showToast('6 adet fotoğraf yakalandı!', 'success');
  });

  // Video Merge Queue
  const renderVideoMergeList = () => {
    const container = document.getElementById('videoMergeList');
    if (state.videoMergeQueue.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:0.85rem; padding:18px;">Video birleştirme listesi boş. Soldan video seçip <strong>"+ Seçili Videoyu Sıraya Ekle"</strong> butonuna basın.</div>`;
      return;
    }
    container.innerHTML = '';
    state.videoMergeQueue.forEach((mId, idx) => {
      const m = state.mediaPool.find(x => x.id === mId);
      if (!m) return;
      const row = document.createElement('div');
      row.className = 'merge-item';
      row.innerHTML = `
        <span><strong>#${idx + 1}</strong> ${m.name} (${formatTime(m.duration)})</span>
        <button class="icon-btn"><i class="fa-solid fa-trash"></i></button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        state.videoMergeQueue.splice(idx, 1);
        renderVideoMergeList();
      });
      container.appendChild(row);
    });
  };

  document.getElementById('addActiveToVideoMergeBtn').addEventListener('click', () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Önce soldan bir video seçin.', 'warning');
    state.videoMergeQueue.push(item.id);
    renderVideoMergeList();
  });

  document.getElementById('mergeVideosExecuteBtn').addEventListener('click', async () => {
    if (state.videoMergeQueue.length < 2) {
      return showToast('Birleştirmek için en az 2 video ekleyin.', 'warning');
    }
    setProgress(true, 'Videolar sırayla birleştiriliyor...', 10);
    const canvas = document.getElementById('videoProcessCanvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    const audioCtx = getAudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const stream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const mime = getSupportedVideoMime();
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3000000 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    rec.start(100);

    for (let i = 0; i < state.videoMergeQueue.length; i++) {
      const item = state.mediaPool.find(x => x.id === state.videoMergeQueue[i]);
      if (!item) continue;
      setProgress(true, `Video ${i + 1}/${state.videoMergeQueue.length} birleştiriliyor...`, ((i) / state.videoMergeQueue.length) * 100);

      const v = document.createElement('video');
      v.src = item.url;
      v.crossOrigin = 'anonymous';
      await new Promise(r => { v.onloadedmetadata = r; });
      const srcNode = audioCtx.createMediaElementSource(v);
      srcNode.connect(dest);

      await v.play();
      await new Promise(resolveClip => {
        const draw = () => {
          if (v.ended || v.paused) {
            srcNode.disconnect();
            resolveClip();
            return;
          }
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      });
    }

    await new Promise(r => {
      rec.onstop = r;
      rec.stop();
    });

    setProgress(false);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    showOutputResult(new Blob(chunks, { type: mime }), `birlestirilmis_video.${ext}`, 'Videolar Başarıyla Birleştirildi!');
  });

  // ==========================================
  // TAB 3: MUXING (EXTRACT AUDIO / ADD AUDIO TO VIDEO)
  // ==========================================
  document.getElementById('extractMp3FromVideoBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    if (!item) return showToast('Lütfen önce sol taraftan bir video seçin.', 'warning');

    setProgress(true, 'Videodan ses ayrıştırılıyor...', 25);
    const buf = await getDecodedAudioBuffer(item);
    const mp3Blob = await encodeAudioBufferToMp3(buf, 192, pct => {
      setProgress(true, 'MP3 olarak hazırlanıyor...', pct);
    });
    setProgress(false);
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    showOutputResult(mp3Blob, `${baseName}_ses.mp3`, 'Videonun Sesi MP3 Olarak Ayrıldı!');
  });

  document.getElementById('muteVideoDownloadBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId && m.type === 'video');
    if (!item) return showToast('Lütfen sol taraftan bir video seçin.', 'warning');

    const { blob, ext } = await processVideoPipeline({
      videoItem: item,
      startSec: 0,
      endSec: item.duration || 10,
      muteOriginal: true
    });
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    showOutputResult(blob, `${baseName}_sessiz.${ext}`, 'Sessiz Video Hazır!');
  });

  document.getElementById('combineVideoAudioBtn').addEventListener('click', async () => {
    const vidId = document.getElementById('muxVideoSelect').value;
    const audId = document.getElementById('muxAudioSelect').value;
    const vidItem = state.mediaPool.find(m => m.id === vidId);
    const audItem = state.mediaPool.find(m => m.id === audId);

    if (!vidItem || !audItem) {
      return showToast('Lütfen hem bir video hem de eklenecek bir MP3 ses dosyası seçin.', 'warning');
    }

    const origVol = (parseFloat(document.getElementById('muxOrigVolRange').value) || 0) / 100;
    const { blob, ext } = await processVideoPipeline({
      videoItem: vidItem,
      startSec: 0,
      endSec: vidItem.duration || 10,
      muteOriginal: origVol === 0,
      origAudioVolume: origVol,
      externalAudioItem: audItem
    });

    const baseName = vidItem.name.replace(/\.[^/.]+$/, '');
    showOutputResult(blob, `${baseName}_yeni_sesli.${ext}`, 'Videoya Yeni Ses Başarıyla Eklendi!');
  });

  // ==========================================
  // TAB 4: AUDIO VISUALIZER (MP3 -> MP4)
  // ==========================================
  document.getElementById('vizBgInput').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { state.vizBgImage = img; };
    img.src = URL.createObjectURL(f);
  });

  const stopVisualizer = () => {
    if (state.vizAnimId) cancelAnimationFrame(state.vizAnimId);
    if (state.previewSource) {
      try { state.previewSource.stop(); } catch (_) {}
      state.previewSource = null;
    }
  };

  document.getElementById('vizStopBtn').addEventListener('click', stopVisualizer);

  document.getElementById('vizPreviewBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    if (!item) return showToast('Lütfen önce soldan bir ses seçin.', 'warning');
    stopVisualizer();

    const ctx = getAudioContext();
    const buf = await getDecodedAudioBuffer(item);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    src.start(0);
    state.previewSource = src;

    const canvas = document.getElementById('vizCanvas');
    const renderLoop = () => {
      const style = document.getElementById('vizStyleSelect').value;
      const title = document.getElementById('vizTitleInput').value;
      drawVisualizerFrame(canvas, analyser, style, title, state.vizBgImage);
      state.vizAnimId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  });

  document.getElementById('vizRenderVideoBtn').addEventListener('click', async () => {
    const item = state.mediaPool.find(m => m.id === state.activeMediaId);
    if (!item) return showToast('Lütfen önce soldan bir ses seçin.', 'warning');
    stopVisualizer();

    const ctx = getAudioContext();
    const buf = await getDecodedAudioBuffer(item);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const dest = ctx.createMediaStreamDestination();

    src.connect(analyser);
    analyser.connect(dest);
    analyser.connect(ctx.destination);

    const canvas = document.getElementById('vizCanvas');
    const combined = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    const mime = getSupportedVideoMime();
    const rec = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 3500000 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    const dur = Math.min(buf.duration, 60);
    const startT = performance.now();
    rec.start(100);
    src.start(0);
    state.previewSource = src;

    await new Promise(resolve => {
      rec.onstop = resolve;
      const loop = (now) => {
        const elapsed = (now - startT) / 1000;
        if (elapsed >= dur) {
          try { src.stop(); } catch (_) {}
          if (rec.state === 'recording') rec.stop();
          return;
        }
        const style = document.getElementById('vizStyleSelect').value;
        const title = document.getElementById('vizTitleInput').value;
        drawVisualizerFrame(canvas, analyser, style, title, state.vizBgImage);
        setProgress(true, 'MP3 video olarak kaydediliyor...', (elapsed / dur) * 100);
        state.vizAnimId = requestAnimationFrame(loop);
      };
      state.vizAnimId = requestAnimationFrame(loop);
    });

    setProgress(false);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    showOutputResult(new Blob(chunks, { type: mime }), `muzik_video.${ext}`, 'MP3 Video Olarak Hazırlandı!');
  });

  // Output Add to Pool Button
  document.getElementById('outputAddToPoolBtn').addEventListener('click', async () => {
    if (state.lastOutputBlob && state.lastOutputName) {
      await addFileToPool(state.lastOutputBlob, state.lastOutputName);
    }
  });
});

// ==========================================
// YOUTUBE DOWNLOAD & STUDIO IMPORT WORKFLOW
// ==========================================
async function triggerYouTubeDownload(info, isAudioOnly = true, importToStudio = false) {
  setProgress(true, 'YouTube medya akışı çözümleniyor (Cobalt / Piped / Invidious)...', 30);

  let directStreamUrl = null;

  // 1. Check if Piped/Invidious already gave us a stream URL
  if (isAudioOnly && info.audioStreams && info.audioStreams.length > 0) {
    directStreamUrl = info.audioStreams[0].url;
  } else if (!isAudioOnly && info.videoStreams && info.videoStreams.length > 0) {
    directStreamUrl = info.videoStreams[0].url;
  }

  // 2. Try Cobalt JSON API if no stream yet
  if (!directStreamUrl) {
    directStreamUrl = await resolveViaCobalt(info.url, isAudioOnly);
  }

  if (directStreamUrl) {
    if (importToStudio) {
      setProgress(true, 'Akış Düzenleme Stüdyosuna aktarılıyor...', 65);
      const proxy = document.getElementById('corsProxySelect').value;
      const fetchUrl = proxy !== 'none' ? `${proxy}${encodeURIComponent(directStreamUrl)}` : directStreamUrl;
      try {
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const safeTitle = info.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
          const ext = isAudioOnly ? 'mp3' : 'mp4';
          await addFileToPool(blob, `${safeTitle}.${ext}`);
          setProgress(false);
          return;
        }
      } catch (_) {}
    }

    // Open direct stream download
    setProgress(false);
    const a = document.createElement('a');
    a.href = directStreamUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.download = `${info.title}.${isAudioOnly ? 'mp3' : 'mp4'}`;
    a.click();
    showToast('Medya indirme başlatıldı!', 'success');
    return;
  }

  // 3. Fallback Links
  setProgress(false);
  renderYouTubeFallbackLinks(info);
  if (importToStudio) {
    showToast('Genel API yoğunluğu nedeniyle örnek medya stüdyoya aktarıldı; kendi API adresinizi ayarlara girebilirsiniz.', 'info');
    await generateSampleMedia();
  } else {
    showToast('Aşağıdaki doğrudan indirme köprülerinden (Cobalt / Piped) tek tıkla indirebilirsiniz.', 'info');
  }
}
