import { supabase, SUPABASE_URL } from './supabase';

export async function callAdminFunction(name: string, body: Record<string, unknown>) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Oturumunuz sona ermiş. Tekrar giriş yapın.');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı. Sunucu işlevini ve bağlantıyı kontrol edin.');
  return result;
}
