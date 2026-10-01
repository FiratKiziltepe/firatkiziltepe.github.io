export type ContentTypeIssue = {
  kind: 'video' | 'interactive' | 'infographic' | 'audio';
  message: string;
};

export const normalizeContentText = (value: string | null | undefined): string =>
  (value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');

const contains = (text: string, pattern: RegExp): boolean => pattern.test(text);

/** Açıklamadaki içerik istekleriyle kayıtlı türleri karşılaştırır. Sonuçlar inceleme önerisidir. */
export const analyzeContentType = (description: string | null | undefined, contentType: string | null | undefined): ContentTypeIssue[] => {
  const explanation = normalizeContentText(description);
  const type = normalizeContentText(contentType);
  const issues: ContentTypeIssue[] = [];

  // Etkileşimli video, bağımsız Video değil Etkileşimli İçerik olarak sınıflanır.
  const standaloneVideoText = explanation.replace(/\betkilesimli\s+(?:(?:bir|sesli|kisa)\s+)*video[a-z]*\b/g, '');
  const videoInDescription = contains(standaloneVideoText, /\bvideo(?!suz)[a-z]*\b/);
  const interactiveInDescription = contains(explanation, /\betkilesimli\b/);
  const interactiveVideoInDescription = contains(explanation, /\betkilesimli\s+video[a-z]*\b/);
  const infographicInDescription = contains(explanation, /\binfo\s*grafi(?:k|g)[a-z]*\b/);
  // Videonun sesli olması, seslendirme ve ses efektleri ayrı Ses içeriği değildir.
  // Bağımsız ses kaydı/dosyası/podcast isteklerini video ile aynı cümlede de koru.
  const explicitAudio = /\b(?:ses\s+(?:kay[di][a-z]*|dosya[a-z]*|icerik[a-z]*)|podcast[a-z]*)\b/;
  const audioInDescription = explanation.split(/[.!?;\n]+/).some(sentence =>
    explicitAudio.test(sentence) ||
    (!/\bvideo[a-z]*\b/.test(sentence) && /\b(?:ses|sesli|sesin|sesi|sesler[a-z]*)\b/.test(sentence))
  );

  if (videoInDescription && !contains(type, /\bvideo[a-z]*\b/)) {
    issues.push({ kind: 'video', message: 'Açıklamada video var; E-İçerik Türü’nde Video yok.' });
  }
  if (interactiveInDescription && !contains(type, /\betkilesimli\b/)) {
    issues.push({
      kind: 'interactive',
      message: interactiveVideoInDescription
        ? 'Açıklamada etkileşimli video var; E-İçerik Türü’nde Etkileşimli İçerik yok.'
        : 'Açıklamada etkileşimli içerik var; E-İçerik Türü’nde Etkileşimli İçerik yok.',
    });
  }
  if (infographicInDescription && !contains(type, /\binfo\s*grafi(?:k|g)[a-z]*\b/)) {
    issues.push({ kind: 'infographic', message: 'Açıklamada infografik var; E-İçerik Türü’nde İnfografik yok.' });
  }
  if (audioInDescription && !contains(type, /\bses[a-z]*\b/)) {
    issues.push({ kind: 'audio', message: 'Açıklamada ses var; E-İçerik Türü’nde Ses yok.' });
  }

  return issues;
};
