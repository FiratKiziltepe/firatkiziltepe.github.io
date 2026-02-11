import React, { useState, useMemo } from 'react';
import type { EIcerik } from '../lib/supabase';
import { BarChart3, Search, X } from 'lucide-react';

interface ReportPanelProps {
  data: EIcerik[];
}

const ReportPanel: React.FC<ReportPanelProps> = ({ data }) => {
  const [lessonSearch, setLessonSearch] = useState('');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

  // Benzersiz program türleri
  const programTypes = useMemo(() => {
    const types = new Set<string>();
    data.forEach(d => { if (d.program_turu) types.add(d.program_turu); });
    return Array.from(types).sort();
  }, [data]);

  // Başlık satırı değerleri (header row values)
  const HEADER_VALUES = ['SIRA NO', 'DERS ADI', 'ÜNİTE/TEMA', 'KAZANIM', 'E-İÇERİK TÜRÜ', 'AÇIKLAMA', 'PROGRAM TÜRÜ',
    'sira_no', 'ders_adi', 'unite_tema', 'kazanim', 'e_icerik_turu', 'aciklama', 'program_turu', 'Program Türü',
    'ÜNİTE/TEMA/ ÖĞRENME ALANI', 'KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM', 'KAZANIM/ÇIKTI'];

  // Benzersiz dersler (başlık satırları hariç)
  const allLessons = useMemo(() => {
    const names: string[] = Array.from(new Set(data.map(d => d.ders_adi)));
    return names
      .filter(name => name && !HEADER_VALUES.includes(name))
      .sort((a, b) => a.localeCompare(b, 'tr'));
  }, [data]);

  // Ders arama sonuçları (dropdown için)
  const searchResults = useMemo(() => {
    if (!lessonSearch) return [];
    return allLessons.filter(l => l.toLowerCase().includes(lessonSearch.toLowerCase()) && !selectedLessons.includes(l));
  }, [allLessons, lessonSearch, selectedLessons]);

  // Gösterilecek dersler: seçili varsa seçili, yoksa hepsi
  const displayLessons = useMemo(() => {
    const lessons = selectedLessons.length > 0 ? selectedLessons : allLessons;
    return lessons.sort();
  }, [allLessons, selectedLessons]);

  // Rapor verisi
  const reportData = useMemo(() => {
    return displayLessons.map(lesson => {
      const rows = data.filter(d => d.ders_adi === lesson);
      const counts: Record<string, number> = {};
      for (const pt of programTypes) {
        counts[pt] = rows.filter(r => r.program_turu === pt).length;
      }
      const total = rows.length;
      return { lesson, counts, total };
    });
  }, [data, displayLessons, programTypes]);

  // Toplam satır
  const totals = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pt of programTypes) {
      counts[pt] = reportData.reduce((sum, r) => sum + (r.counts[pt] || 0), 0);
    }
    const total = reportData.reduce((sum, r) => sum + r.total, 0);
    return { counts, total };
  }, [reportData, programTypes]);

  const toggleLesson = (lesson: string) => {
    setSelectedLessons(prev => prev.includes(lesson) ? prev.filter(l => l !== lesson) : [...prev, lesson]);
    setLessonSearch('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          <BarChart3 size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ders Adı ve Program Türü Dağılımı</h2>
          <p className="text-xs text-slate-400 font-medium">{allLessons.length} ders · {data.length} toplam satır</p>
        </div>
      </div>

      {/* Ders filtresi */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Ders ara ve seç..."
              className="w-full border-2 border-slate-100 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none font-medium"
              value={lessonSearch}
              onChange={e => setLessonSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                {searchResults.map(l => (
                  <button key={l} onClick={() => toggleLesson(l)} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-indigo-50 transition-colors">
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedLessons.length > 0 && (
            <button onClick={() => setSelectedLessons([])} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
              Tümünü Göster
            </button>
          )}
        </div>

        {selectedLessons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedLessons.map(l => (
              <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                {l}
                <button onClick={() => toggleLesson(l)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rapor tablosu */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4f6bca] text-white">
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/20 w-16 text-center">SIRA NO</th>
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/20 min-w-[200px]">DERS ADI</th>
                {programTypes.map(pt => (
                  <th key={pt} className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/20 text-center min-w-[100px]">{pt}</th>
                ))}
                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-center min-w-[120px]">GENEL TOPLAM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, idx) => (
                <tr key={row.lesson} className={`hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-400 text-center">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.lesson}</td>
                  {programTypes.map(pt => (
                    <td key={pt} className="px-4 py-3 text-sm font-bold text-center">
                      {row.counts[pt] ? (
                        <span className="text-indigo-600">{row.counts[pt]}</span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">{row.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold">
                <td className="px-4 py-4 text-xs text-center" colSpan={2}>TOPLAM</td>
                {programTypes.map(pt => (
                  <td key={pt} className="px-4 py-4 text-sm font-black text-center">{totals.counts[pt] || 0}</td>
                ))}
                <td className="px-4 py-4 text-sm font-black text-center text-emerald-400">{totals.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPanel;

