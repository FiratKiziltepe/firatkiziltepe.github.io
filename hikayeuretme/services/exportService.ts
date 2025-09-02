
import { StoryData } from '../types';

const getBaseHtmlStructure = (story: StoryData, contentAndScript: string): string => {
  return `
<!DOCTYPE html>
<html lang="${story.language.split('-')[0]}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif;
            background: #7F00FF;
            background: -webkit-linear-gradient(to right, #E100FF, #7F00FF);
            background: linear-gradient(to right, #E100FF, #7F00FF);
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1rem;
        }
        .container {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            padding: 2rem;
            max-width: 900px;
            width: 100%;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            color: white;
            transition: all 0.2s ease-in-out;
            border: none;
            cursor: pointer;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .btn-pink { background-color: #ec4899; }
        .btn-pink:hover:not(:disabled) { background-color: #db2777; }
        .btn-purple { background-color: #8b5cf6; }
        .btn-purple:hover:not(:disabled) { background-color: #7c3aed; }
        .btn-green { background-color: #22c55e; }
        .btn-green:hover:not(:disabled) { background-color: #16a34a; }
        .btn-red { background-color: #ef4444; }
        .btn-red:hover:not(:disabled) { background-color: #dc2626; }
        .btn-gray { background-color: #6b7280; }
    </style>
</head>
<body>
    <div id="app" class="container">
        <!-- Content will be rendered by JavaScript -->
    </div>
    <script>
        ${contentAndScript}
    </script>
</body>
</html>
  `;
};

const getSanitizedStoryJson = (story: StoryData): string => {
    const sanitizedStory = {
        ...story,
        scenes: story.scenes.map(scene => ({
          ...scene,
          isGeneratingAudio: undefined,
          audioUrl: undefined,
        }))
    };
    return JSON.stringify(sanitizedStory)
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/`/g, '\\`')   // Escape backticks
      .replace(/\$/g, '\\$'); // Escape dollars
};


export const generateElevenLabsAudiobookHtml = (story: StoryData): string => {
  const storyJson = getSanitizedStoryJson(story);

  const script = `
        const storyData = JSON.parse(\`${storyJson}\`);
        let currentSceneIndex = 0;
        const app = document.getElementById('app');
        const audio = new Audio();
        let playbackState = 'idle'; // 'idle', 'playing', 'paused', 'error'

        function render() {
            const scene = storyData.scenes[currentSceneIndex];
            const hasAudio = scene.audioBase64 && scene.audioBase64.length > 500;
            
            let playButtonHtml = '';
            if (playbackState === 'error') {
                 playButtonHtml = \`<button id="play-btn" class="btn btn-gray" disabled><i class="fas fa-exclamation-triangle mr-2"></i> Error</button>\`;
            } else if (!hasAudio) {
                 playButtonHtml = \`<button id="play-btn" class="btn btn-gray" disabled><i class="fas fa-microphone-slash mr-2"></i> No Audio</button>\`;
            } else if (playbackState === 'playing') {
                playButtonHtml = \`<button id="play-btn" class="btn btn-red"><i class="fas fa-pause mr-2"></i> Pause</button>\`;
            } else {
                playButtonHtml = \`<button id="play-btn" class="btn btn-green"><i class="fas fa-play mr-2"></i> Play</button>\`;
            }

            app.innerHTML = \`
                <div class="text-center">
                    <h1 class="text-4xl font-bold mb-2 text-purple-800">\${storyData.title.replace(/</g, "&lt;")}</h1>
                    <p class="text-xl text-gray-600 mb-4">Scene \${currentSceneIndex + 1} of \${storyData.scenes.length}</p>
                </div>
                <div class="aspect-video bg-gray-200 rounded-lg shadow-lg overflow-hidden mb-4 flex items-center justify-center">
                    <img id="scene-image" src="\${scene.imageUrl}" alt="Illustration for scene \${currentSceneIndex + 1}" class="w-full h-full object-cover">
                </div>
                <div class="bg-white/70 p-6 rounded-lg shadow-inner mb-6">
                    <p id="scene-text" class="text-gray-700 text-lg leading-relaxed whitespace-pre-line">\${scene.scene_text.replace(/</g, "&lt;")}</p>
                </div>
                <div class="flex justify-between items-center flex-wrap gap-4">
                    <button id="prev-btn" class="btn btn-pink"><i class="fas fa-arrow-left mr-2"></i>Previous</button>
                    \${playButtonHtml}
                    <button id="next-btn" class="btn btn-purple">Next<i class="fas fa-arrow-right ml-2"></i></button>
                </div>
            \`;

            document.getElementById('prev-btn').addEventListener('click', prevScene);
            document.getElementById('next-btn').addEventListener('click', nextScene);
            document.getElementById('play-btn').addEventListener('click', togglePlay);
            updateNavButtons();
            
            if (hasAudio && audio.src !== scene.audioBase64) {
              audio.src = scene.audioBase64;
            }
        }
        
        function updateNavButtons() {
            document.getElementById('prev-btn').disabled = currentSceneIndex === 0;
            document.getElementById('next-btn').disabled = currentSceneIndex === storyData.scenes.length - 1;
        }
        
        function stopAudio() { audio.pause(); audio.currentTime = 0; playbackState = 'idle'; }
        
        function prevScene() { if (currentSceneIndex > 0) { currentSceneIndex--; stopAudio(); render(); } }
        function nextScene() { if (currentSceneIndex < storyData.scenes.length - 1) { currentSceneIndex++; stopAudio(); render(); } }
        
        function togglePlay() {
            if (playbackState === 'error') return;
            const scene = storyData.scenes[currentSceneIndex];
            if (!scene.audioBase64 || scene.audioBase64.length < 500) return;
            if (playbackState === 'playing') { audio.pause(); } 
            else { audio.play().catch(e => { console.error("Audio playback failed:", e); playbackState = 'error'; render(); }); }
        }
        
        audio.onplay = () => { playbackState = 'playing'; render(); };
        audio.onpause = () => { if (audio.currentTime < audio.duration) { playbackState = 'paused'; } render(); };
        audio.onended = () => { stopAudio(); render(); }
        audio.onerror = (e) => { console.error("Audio element error:", e); playbackState = 'error'; render(); };
        render();
  `;
  return getBaseHtmlStructure(story, script);
};

export const generateBrowserTtsAudiobookHtml = (story: StoryData): string => {
  const storyJson = getSanitizedStoryJson(story);

  const script = `
        const storyData = JSON.parse(\`${storyJson}\`);
        let currentSceneIndex = 0;
        const app = document.getElementById('app');
        let speechState = 'idle'; // 'idle', 'speaking', 'paused'

        // Clean up speech on page leave
        window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());

        function render() {
            const scene = storyData.scenes[currentSceneIndex];
            
            let playButtonHtml = '';
            if (speechState === 'speaking') {
                playButtonHtml = \`<button id="play-btn" class="btn btn-red"><i class="fas fa-pause mr-2"></i> Pause</button>\`;
            } else {
                playButtonHtml = \`<button id="play-btn" class="btn btn-green"><i class="fas fa-play mr-2"></i> Play</button>\`;
            }

            app.innerHTML = \`
                <div class="text-center">
                    <h1 class="text-4xl font-bold mb-2 text-purple-800">\${storyData.title.replace(/</g, "&lt;")}</h1>
                    <p class="text-xl text-gray-600 mb-4">Scene \${currentSceneIndex + 1} of \${storyData.scenes.length}</p>
                </div>
                <div class="aspect-video bg-gray-200 rounded-lg shadow-lg overflow-hidden mb-4 flex items-center justify-center">
                    <img id="scene-image" src="\${scene.imageUrl}" alt="Illustration for scene \${currentSceneIndex + 1}" class="w-full h-full object-cover">
                </div>
                <div class="bg-white/70 p-6 rounded-lg shadow-inner mb-6">
                    <p id="scene-text" class="text-gray-700 text-lg leading-relaxed whitespace-pre-line">\${scene.scene_text.replace(/</g, "&lt;")}</p>
                </div>
                <div class="flex justify-between items-center flex-wrap gap-4">
                    <button id="prev-btn" class="btn btn-pink"><i class="fas fa-arrow-left mr-2"></i>Previous</button>
                    \${playButtonHtml}
                    <button id="next-btn" class="btn btn-purple">Next<i class="fas fa-arrow-right ml-2"></i></button>
                </div>
            \`;

            document.getElementById('prev-btn').addEventListener('click', prevScene);
            document.getElementById('next-btn').addEventListener('click', nextScene);
            document.getElementById('play-btn').addEventListener('click', togglePlay);
            updateNavButtons();
        }
        
        function updateNavButtons() {
            document.getElementById('prev-btn').disabled = currentSceneIndex === 0;
            document.getElementById('next-btn').disabled = currentSceneIndex === storyData.scenes.length - 1;
        }
        
        function stopSpeech() { window.speechSynthesis.cancel(); speechState = 'idle'; }
        
        function prevScene() { if (currentSceneIndex > 0) { currentSceneIndex--; stopSpeech(); render(); } }
        function nextScene() { if (currentSceneIndex < storyData.scenes.length - 1) { currentSceneIndex++; stopSpeech(); render(); } }
        
        function togglePlay() {
            if (speechState === 'speaking') {
                window.speechSynthesis.pause();
                speechState = 'paused';
            } else if (speechState === 'paused') {
                window.speechSynthesis.resume();
                speechState = 'speaking';
            } else {
                const scene = storyData.scenes[currentSceneIndex];
                const utterance = new SpeechSynthesisUtterance(scene.scene_text);
                utterance.lang = storyData.language;
                utterance.onstart = () => { speechState = 'speaking'; render(); };
                utterance.onpause = () => { speechState = 'paused'; render(); };
                utterance.onresume = () => { speechState = 'speaking'; render(); };
                utterance.onend = () => { speechState = 'idle'; render(); };
                utterance.onerror = (e) => { console.error("Speech synthesis error", e); speechState = 'idle'; render(); };
                stopSpeech(); // Clear queue before speaking
                window.speechSynthesis.speak(utterance);
            }
            render();
        }
        
        render();
  `;
  return getBaseHtmlStructure(story, script);
};
