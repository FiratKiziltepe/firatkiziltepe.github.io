import { nas, API_BASE } from './apiClient';

export async function callAdminFunction(name: string, body: Record<string, unknown>) {
  const { data: { session }, error } = await nas.auth.getSession();
  if (error || !session) throw new Error('Oturumunuz sona ermiş. Tekrar giriş yapın.');
  const response = await fetch(`${API_BASE}?action=${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.access_token },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı. Sunucu işlevini ve bağlantıyı kontrol edin.');
  return result;
}
