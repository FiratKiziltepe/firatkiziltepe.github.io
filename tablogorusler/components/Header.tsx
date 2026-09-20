import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../lib/supabase';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  profile: Profile;
}

const rolLabels: Record<string, string> = {
  admin: 'Sistem Yöneticisi',
  moderator: 'Komisyon Başkanı',
  teacher: 'Öğretmen',
};

const Header: React.FC<HeaderProps> = ({ profile }) => {
  const { signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Hoş Geldiniz /</span>
        <span className="text-sm font-semibold text-gray-900">{rolLabels[profile.rol] || profile.rol}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {profile.ad_soyad.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{profile.ad_soyad}</p>
            <p className="text-xs text-gray-500">{profile.brans}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100 font-bold"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
