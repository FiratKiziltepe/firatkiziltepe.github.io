export interface RawDataRow {
  "Entry Id": string;
  "DERS": string;
  "SINIF": string;
  "Görüş, tespit veya önerilerinizi buraya yazabilirsiniz.": string;
  [key: string]: string | boolean | undefined;
}

export interface AnalysisResult {
  entryId: string;
  mainCategory: string;
  subTheme: string;
  sentiment: "Pozitif" | "Negatif" | "Nötr";
  actionable: boolean;
}

export interface BatchAnalysisResponse {
  items: AnalysisResult[];
}

export interface EnrichedDataRow extends RawDataRow {
  mainCategory?: string;
  subTheme?: string;
  sentiment?: string;
  actionable?: boolean;
}

export interface AnalysisStats {
  totalRows: number;
  categoryCounts: Record<string, number>;
  themeCounts: Record<string, number>;
  sentimentCounts: Record<string, number>;
  actionableCount: number;
  nonActionableCount: number;
}
