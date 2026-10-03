import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nas, API_BASE, Profile } from '../lib/apiClient';
import type { NasUser as User, NasSession as Session } from '../lib/nasClient';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  needsPasswordChange: boolean;
  connectionError: string | null;
  signIn: (kullaniciAdi: string, sifre: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await nas
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { setConnectionError(error.message); return; }
    setConnectionError(null);
    if (data) {
      setNeedsPasswordChange(data.sifre_degistirildi === false);
      setProfile(prev => {
        if (prev && prev.id === data.id && prev.rol === data.rol &&
            prev.ad_soyad === data.ad_soyad && prev.kullanici_adi === data.kullanici_adi &&
            JSON.stringify(prev.atanan_dersler) === JSON.stringify(data.atanan_dersler) &&
            prev.sifre_degistirildi === data.sifre_degistirildi) {
          return prev;
        }
        return data as Profile;
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    nas.auth.getSession().then(async ({ data: { session }, error }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      if (error) setConnectionError(error.message);
      setLoading(false);
    });

    const { data: { subscription } } = nas.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (kullaniciAdi: string, sifre: string) => {
    const email = `${kullaniciAdi}@tablogorusler.local`;
    const { error } = await nas.auth.signInWithPassword({ email, password: sifre });
    if (error) return { error: error.message };
    setConnectionError(null);
    return { error: null };
  };

  const signOut = async () => {
    await nas.auth.signOut();
    setProfile(null);
    setNeedsPasswordChange(false);
  };

  const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!session?.access_token) return { error: 'Oturum bulunamadı' };
    try {
      const res = await fetch(`${API_BASE}?action=manage-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': session.access_token,
        },
        body: JSON.stringify({ action: 'change_own_password', new_password: newPassword }),
      });
      const result = await res.json();
      if (!res.ok) return { error: result.error || 'Şifre değiştirilemedi' };
      setNeedsPasswordChange(false);
      if (profile) {
        setProfile({ ...profile, sifre_degistirildi: true });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Bağlantı hatası' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, needsPasswordChange, connectionError, signIn, signOut, refreshProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

