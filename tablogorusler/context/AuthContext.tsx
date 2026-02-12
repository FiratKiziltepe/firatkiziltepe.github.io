import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_URL, Profile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  needsPasswordChange: boolean;
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

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
    if (error) return { error: 'Kullanıcı adı veya şifre hatalı!' };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNeedsPasswordChange(false);
  };

  const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!session?.access_token) return { error: 'Oturum bulunamadı' };
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
    <AuthContext.Provider value={{ user, profile, session, loading, needsPasswordChange, signIn, signOut, refreshProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

