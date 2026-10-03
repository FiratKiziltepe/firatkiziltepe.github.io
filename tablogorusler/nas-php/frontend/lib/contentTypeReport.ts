import { normalizeContentText } from './contentTypeAnalysis.ts';

const labels: Record<string, string> = {
  video: 'Video', ses: 'Ses', 'etkilesimli icerik': 'Etkileşimli İçerik', infografik: 'İnfografik',
};

export function contentTypes(value: string | null | undefined): string[] {
  const parts = (value || '').split(/[/,;\n]+/).map(part => part.trim()).filter(Boolean);
  return [...new Set(parts.map(part => labels[normalizeContentText(part)] || part))];
}

export function summarizeContentTypes(rows: { e_icerik_turu: string | null }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const types = contentTypes(row.e_icerik_turu);
    for (const type of types.length ? types : ['Belirtilmemiş']) counts.set(type, (counts.get(type) || 0) + 1);
  }
  return [...counts].map(([type, count]) => ({ type, count, percent: rows.length ? count / rows.length * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type, 'tr'));
}
