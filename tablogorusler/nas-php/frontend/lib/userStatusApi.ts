import { nas } from './apiClient';

type UserStatusResult = { statuses?: Record<string, boolean>; updated?: number; errors?: string[] };

export async function manageUserStatus(action: 'list' | 'set', active?: boolean, userId?: string): Promise<UserStatusResult> {
  const { data, error } = await nas.rpc('manage_user_status', {
    p_action: action,
    p_active: active ?? null,
    p_user_id: userId ?? null,
  });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new Error('Kullanıcı erişimi kurulumu tamamlanmamış. Hazırlanan SQL kurulumunu çalıştırın.');
    }
    throw new Error(error.message || 'Kullanıcı durumları alınamadı. Lütfen tekrar deneyin.');
  }
  return data as UserStatusResult;
}
