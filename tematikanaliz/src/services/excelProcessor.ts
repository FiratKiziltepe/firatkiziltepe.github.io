import * as XLSX from "xlsx";
import { RawDataRow, EnrichedDataRow, AnalysisResult, AnalysisStats } from "../types";

export class ExcelProcessor {
  static parseExcelFile(file: File): Promise<RawDataRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as RawDataRow[];

          // Validate required columns
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const hasRequiredColumns =
              "Entry Id" in firstRow &&
              "DERS" in firstRow &&
              "SINIF" in firstRow &&
              "Görüş, tespit veya önerilerinizi buraya yazabilirsiniz." in firstRow;

            if (!hasRequiredColumns) {
              reject(new Error("Excel dosyası gerekli sütunları içermiyor."));
              return;
            }
          }

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Dosya okuma hatası"));
      reader.readAsBinaryString(file);
    });
  }

  static enrichDataWithAnalysis(
    rawData: RawDataRow[],
    analysisResults: AnalysisResult[]
  ): EnrichedDataRow[] {
    // Create a map for quick lookup
    const analysisMap = new Map<string, AnalysisResult>();
    analysisResults.forEach((result) => {
      analysisMap.set(result.entryId, result);
    });

    return rawData.map((row) => {
      const analysis = analysisMap.get(row["Entry Id"]);
      return {
        ...row,
        mainCategory: analysis?.mainCategory || "İşlenmedi",
        subTheme: analysis?.subTheme || "İşlenmedi",
        sentiment: analysis?.sentiment || "Nötr",
        actionable: analysis?.actionable || false,
      };
    });
  }

  static exportToExcel(enrichedData: EnrichedDataRow[], filename: string = "analiz_sonuclari.xlsx") {
    // Prepare data for export
    const exportData = enrichedData.map((row) => ({
      "Entry Id": row["Entry Id"],
      "Ders": row["DERS"],
      "Sınıf": row["SINIF"],
      "Görüş": row["Görüş, tespit veya önerilerinizi buraya yazabilirsiniz."],
      "Ana Kategori": row.mainCategory,
      "Alt Tema": row.subTheme,
      "Sentiment": row.sentiment,
      "Eyleme Dönüştürülebilir": row.actionable ? "Evet" : "Hayır",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analiz Sonuçları");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = [
      { wch: 15 }, // Entry Id
      { wch: 20 }, // Ders
      { wch: 10 }, // Sınıf
      { wch: maxWidth }, // Görüş
      { wch: 25 }, // Ana Kategori
      { wch: 30 }, // Alt Tema
      { wch: 12 }, // Sentiment
      { wch: 20 }, // Eyleme Dönüştürülebilir
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, filename);
  }

  static calculateStats(analysisResults: AnalysisResult[]): AnalysisStats {
    const categoryCounts: Record<string, number> = {};
    const themeCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};
    let actionableCount = 0;
    let nonActionableCount = 0;

    analysisResults.forEach((result) => {
      // Category counts
      categoryCounts[result.mainCategory] = (categoryCounts[result.mainCategory] || 0) + 1;

      // Theme counts
      themeCounts[result.subTheme] = (themeCounts[result.subTheme] || 0) + 1;

      // Sentiment counts
      sentimentCounts[result.sentiment] = (sentimentCounts[result.sentiment] || 0) + 1;

      // Actionable counts
      if (result.actionable) {
        actionableCount++;
      } else {
        nonActionableCount++;
      }
    });

    return {
      totalRows: analysisResults.length,
      categoryCounts,
      themeCounts,
      sentimentCounts,
      actionableCount,
      nonActionableCount,
    };
  }
}
