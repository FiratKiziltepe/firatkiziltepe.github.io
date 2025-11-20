import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { RawDataRow, BatchAnalysisResponse, AnalysisResult } from "../types";

const MODEL_NAME = "gemini-2.0-flash-exp";
const BATCH_SIZE = 50; // Process 50 rows at a time to avoid token limits

// Schema for structured output
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          entryId: { type: SchemaType.STRING, description: "The Entry Id provided in the input" },
          mainCategory: { type: SchemaType.STRING, description: "Ana kategori (Örn: Ders Kitabı İçeriği, Müfredat, Ölçme Değerlendirme, Fiziki Koşullar, Öğretmen Kılavuzu)" },
          subTheme: { type: SchemaType.STRING, description: "Spesifik alt tema (Örn: Etkinlik zorluğu, Kaynak yetersizliği, Kazanım uyumsuzluğu)" },
          sentiment: { type: SchemaType.STRING, enum: ["Pozitif", "Negatif", "Nötr"], description: "Görüşün duygu durumu" },
          actionable: { type: SchemaType.BOOLEAN, description: "Somut bir öneri veya aksiyon içeriyor mu?" }
        },
        required: ["entryId", "mainCategory", "subTheme", "sentiment", "actionable"]
      }
    }
  }
};

export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeBatch(rows: RawDataRow[]): Promise<BatchAnalysisResponse> {
    const promptData = rows.map(r => ({
      id: r["Entry Id"],
      text: r["Görüş, tespit veya önerilerinizi buraya yazabilirsiniz."] || "",
      context: `${r.DERS} - ${r.SINIF}`
    }));

    const prompt = `
Aşağıda öğretmenlerin eğitim materyalleri ve müfredat hakkındaki görüşleri bulunmaktadır.
Bu görüşleri analiz et ve JSON formatında yapılandır.
Eğer görüş boşsa veya anlamsızsa, kategori olarak "Diğer", sentiment olarak "Nötr" işaretle.

Ana Kategoriler (sadece bunları kullan):
- Ders Kitabı İçeriği
- Müfredat
- Ölçme Değerlendirme
- Fiziki Koşullar
- Öğretmen Kılavuzu
- Öğrenci Seviyesi
- Zaman Yönetimi
- Diğer

Veriler:
${JSON.stringify(promptData, null, 2)}
`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text) throw new Error("Empty response from Gemini");

      return JSON.parse(text) as BatchAnalysisResponse;
    } catch (error) {
      console.error("Batch analysis error:", error);
      // Return empty list on failure to allow process to continue with next batch
      return { items: [] };
    }
  }

  async analyzeAll(
    rows: RawDataRow[],
    onProgress: (current: number, total: number) => void
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

      console.log(`Processing batch ${currentBatch}/${totalBatches}`);
      onProgress(i + batch.length, rows.length);

      const batchResult = await this.analyzeBatch(batch);
      results.push(...batchResult.items);

      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async generateExecutiveSummary(analysisResults: AnalysisResult[]): Promise<string> {
    // Summarize the data first to avoid token limits
    const categoryCounts = analysisResults.reduce((acc, item) => {
      acc[item.mainCategory] = (acc[item.mainCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentimentCounts = analysisResults.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionableCount = analysisResults.filter(i => i.actionable).length;
    const topThemes = analysisResults
      .slice(0, 100)
      .map(i => `${i.mainCategory}: ${i.subTheme}`)
      .join("; ");

    const prompt = `
Sen kıdemli bir eğitim analistisin. Binlerce öğretmen görüşünün analiz sonuçlarını inceledin.
Aşağıdaki özet verilere dayanarak, Milli Eğitim Bakanlığı yetkilileri için üst düzey bir yönetici özeti (Executive Summary) yaz.

Toplam Görüş Sayısı: ${analysisResults.length}

Kategori Dağılımı: ${JSON.stringify(categoryCounts, null, 2)}

Sentiment Dağılımı: ${JSON.stringify(sentimentCounts, null, 2)}

Eyleme Dönüştürülebilir Görüş Sayısı: ${actionableCount} (${((actionableCount / analysisResults.length) * 100).toFixed(1)}%)

Örnek Temalar (ilk 100): ${topThemes}

Lütfen şu başlıkları kullan:
1. Genel Durum Değerlendirmesi
2. Öne Çıkan Sorun Alanları
3. En Sık Rastlanan Alt Temalar
4. İyileştirme Önerileri
5. Öncelikli Aksiyon Maddeleri

Türkçe ve resmi bir dil kullan. Markdown formatında yaz.
`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      return result.response.text() || "Özet oluşturulamadı.";
    } catch (e) {
      console.error("Summary generation error:", e);
      return "Özet oluşturulurken bir hata oluştu.";
    }
  }
}
