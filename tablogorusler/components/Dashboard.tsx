import React from 'react';
import type { Profile, DegisiklikLogu } from '../lib/supabase';
import { FileText, Clock, AlertCircle, CheckCircle, History } from 'lucide-react';

interface DashboardProps {
  profile: Profile;
  dataCount: number;
  pendingCount: number;
  logs: DegisiklikLogu[];
  users: Profile[];
}

const Dashboard: React.FC<DashboardProps> = ({ profile, dataCount, pendingCount, logs, users }) => {
  const stats = [
    { label: 'İncelenen Ders Sayısı', value: profile.atanan_dersler.length || 'Tümü', icon: <FileText className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Toplam İçerik Satırı', value: dataCount, icon: <Clock className="text-purple-600" />, color: 'bg-purple-50' },
    { label: 'Bekleyen Talepler', value: pendingCount, icon: <AlertCircle className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Kayıtlı Kullanıcı', value: users.length || '-', icon: <CheckCircle className="text-emerald-600" />, color: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-3xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Hoş Geldiniz, {profile.ad_soyad}!</h2>
        <p className="text-blue-100 opacity-90 max-w-2xl">
          Müfredat içeriklerini inceleyebilir, e-içerik ekleme/çıkarma önerilerinde bulunabilir ve
          değişiklik taleplerini yönetebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`${stat.color} p-3 rounded-xl`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <History size={22} className="text-orange-500" /> Son Aktiviteler
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">
                    {log.islem_tipi?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{log.islem_tipi}</p>
                    <p className="text-xs text-gray-500">{log.aciklama}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-400">Henüz bir aktivite kaydı bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Tanımlı Dersler</h3>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {profile.atanan_dersler.length > 0 ? profile.atanan_dersler.map((lesson) => (
                <span key={lesson} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                  {lesson}
                </span>
              )) : (
                <span className="text-sm text-gray-400 italic">Tüm derslere erişiminiz var (Admin)</span>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              {profile.rol === 'admin'
                ? 'Admin olarak tüm derslere ve tüm işlemlere erişiminiz bulunmaktadır.'
                : 'Sadece bu derslere ait içeriklerde düzenleme önerisi sunabilir veya moderasyon yapabilirsiniz.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
