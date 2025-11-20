import React, { useState } from "react";
import { EnrichedDataRow } from "../types";

interface AnalysisResultsProps {
  data: EnrichedDataRow[];
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const itemsPerPage = 20;

  // Get unique categories
  const categories = Array.from(new Set(data.map((d) => d.mainCategory).filter(Boolean)));

  // Filter data
  const filteredData = data.filter((row) => {
    const matchesSearch =
      searchTerm === "" ||
      row["Görüş, tespit veya önerilerinizi buraya yazabilirsiniz."]
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      row["Entry Id"]?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || row.mainCategory === categoryFilter;

    const matchesSentiment = sentimentFilter === "all" || row.sentiment === sentimentFilter;

    return matchesSearch && matchesCategory && matchesSentiment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getSentimentBadgeColor = (sentiment?: string) => {
    switch (sentiment) {
      case "Pozitif":
        return "bg-green-100 text-green-800";
      case "Negatif":
        return "bg-red-100 text-red-800";
      case "Nötr":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Analiz Sonuçları</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <input
              type="text"
              placeholder="Arama (Entry ID veya görüş metni)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Sentimentler</option>
              <option value="Pozitif">Pozitif</option>
              <option value="Negatif">Negatif</option>
              <option value="Nötr">Nötr</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Gösterilen: {startIndex + 1}-{Math.min(endIndex, filteredData.length)} / Toplam:{" "}
          {filteredData.length}
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ders / Sınıf
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Görüş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ana Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alt Tema
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eyleme Dönüştürülebilir
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row["Entry Id"]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {row["DERS"]} / {row["SINIF"]}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                  <div className="line-clamp-3">
                    {row["Görüş, tespit veya önerilerinizi buraya yazabilirsiniz."] || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {row.mainCategory}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                  <div className="line-clamp-2">{row.subTheme}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getSentimentBadgeColor(row.sentiment)}`}>
                    {row.sentiment}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {row.actionable ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Önceki
          </button>
          <span className="text-sm text-gray-600">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
};
