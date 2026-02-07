import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kullaniciAdi || !sifre) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signIn(kullaniciAdi, sifre);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6">
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">E-İçerik İnceleme Sistemi</h1>
          <p className="text-blue-300/70 text-sm font-medium">Müfredat Düzenleme ve Onay Platformu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl">
          {error && (
            <div className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-200 px-5 py-4 rounded-2xl mb-6 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-blue-300/60 uppercase tracking-[0.2em] ml-2 mb-2 block">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                autoFocus
                className="w-full bg-white/10 border-2 border-white/10 text-white placeholder-white/30 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all text-lg"
                placeholder="Kullanıcı adınızı giriniz"
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-blue-300/60 uppercase tracking-[0.2em] ml-2 mb-2 block">
                Şifre
              </label>
              <input
                type="password"
                className="w-full bg-white/10 border-2 border-white/10 text-white placeholder-white/30 p-4 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all text-lg"
                placeholder="••••••••"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                GİRİŞ YAP
              </>
            )}
          </button>
        </form>

        <p className="text-center text-blue-400/40 text-xs mt-8 font-bold">
          Eğitim Materyalleri İnceleme Sistemi v2.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

