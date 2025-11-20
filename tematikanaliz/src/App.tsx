import { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { Charts } from "./components/Charts";
import { AnalysisResults } from "./components/AnalysisResults";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { ExcelProcessor } from "./services/excelProcessor";
import { GeminiAnalyzer } from "./services/gemini";
import { RawDataRow, AnalysisResult, EnrichedDataRow, AnalysisStats } from "./types";

type AppState = "initial" | "file_uploaded" | "analyzing" | "completed";

function App() {
  const [state, setState] = useState<AppState>("initial");
  const [apiKey, setApiKey] = useState("");
  const [rawData, setRawData] = useState<RawDataRow[]>([]);
  const [enrichedData, setEnrichedData] = useState<EnrichedDataRow[]>([]);
  const [, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [, setShowApiKeyInput] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setError("");
      const data = await ExcelProcessor.parseExcelFile(file);
      setRawData(data);
      setState("file_uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dosya işlenirken bir hata oluştu.");
    }
  };

  const handleStartAnalysis = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      setError("");
      setState("analyzing");
      setProgress({ current: 0, total: rawData.length });

      const analyzer = new GeminiAnalyzer(apiKey);

      // Analyze all rows
      const results = await analyzer.analyzeAll(rawData, (current, total) => {
        setProgress({ current, total });
      });

      setAnalysisResults(results);

      // Calculate stats
      const calculatedStats = ExcelProcessor.calculateStats(results);
      setStats(calculatedStats);

      // Enrich data
      const enriched = ExcelProcessor.enrichDataWithAnalysis(rawData, results);
      setEnrichedData(enriched);

      // Generate executive summary
      const summary = await analyzer.generateExecutiveSummary(results);
      setExecutiveSummary(summary);

      setState("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz sırasında bir hata oluştu.");
      setState("file_uploaded");
    }
  };

  const handleExportToExcel = () => {
    if (enrichedData.length === 0) return;
    ExcelProcessor.exportToExcel(enrichedData);
  };

  const handleReset = () => {
    setState("initial");
    setRawData([]);
    setEnrichedData([]);
    setAnalysisResults([]);
    setStats(null);
    setExecutiveSummary("");
    setProgress({ current: 0, total: 0 });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tematik Analiz Sistemi
          </h1>
          <p className="text-gray-600">
            Gemini AI ile Güçlendirilmiş Öğretmen Görüş Analizi
          </p>
        </div>

        {/* API Key Section */}
        {state === "initial" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Anahtarı
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza... ile başlayan API anahtarınızı girin"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  API anahtarınız tarayıcınızda saklanır ve hiçbir sunucuya gönderilmez.
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 ml-1"
                  >
                    Buradan bir anahtar alabilirsiniz →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        {state === "initial" && (
          <div className="mb-6">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* Analysis Controls */}
        {state === "file_uploaded" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Dosya Yüklendi: {rawData.length} satır
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Analize başlamak için butona tıklayın
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleStartAnalysis}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Analizi Başlat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {state === "analyzing" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Analiz Devam Ediyor...</h3>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-center text-gray-600">
                {progress.current} / {progress.total} satır işlendi (
                {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%)
              </p>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {state === "completed" && stats && (
          <>
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Analiz Tamamlandı!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.totalRows} satır başarıyla analiz edildi
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Yeni Analiz
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Excel İndir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Toplam Görüş</div>
                <div className="text-3xl font-bold text-blue-600">{stats.totalRows}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Ana Kategori</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {Object.keys(stats.categoryCounts).length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Alt Tema</div>
                <div className="text-3xl font-bold text-purple-600">
                  {Object.keys(stats.themeCounts).length}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Eyleme Dönüştürülebilir</div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round((stats.actionableCount / stats.totalRows) * 100)}%
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="mb-6">
              <Charts stats={stats} />
            </div>

            {/* Executive Summary */}
            {executiveSummary && (
              <div className="mb-6">
                <ExecutiveSummary summary={executiveSummary} />
              </div>
            )}

            {/* Detailed Results */}
            <AnalysisResults data={enrichedData} />
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Gemini 2.0 Flash ile güçlendirilmiştir • Tüm analiz tarayıcınızda gerçekleşir</p>
        </div>
      </div>
    </div>
  );
}

export default App;
