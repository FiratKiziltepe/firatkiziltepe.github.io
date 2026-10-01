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

  const videoInDescription = contains(explanation, /\bvideo(?!suz)[a-z]*\b/);
  const interactiveInDescription = contains(explanation, /\betkilesimli\b/);
  const interactiveVideoInDescription = contains(explanation, /\betkilesimli\s+video[a-z]*\b/);
  const infographicInDescription = contains(explanation, /\binfo\s*grafi(?:k|g)[a-z]*\b/);
  const audioInDescription = contains(explanation, /\bses(?!siz)[a-z]*\b/);

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
