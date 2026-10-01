// @ts-nocheck -- Supabase Edge Runtime (Deno); excluded from browser compilation.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Oturum gerekli.' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: 'Geçersiz oturum.' }, 401);
  const { data: caller, error: callerError } = await admin.auth.admin.getUserById(user.id);
  if (callerError || !caller.user || (caller.user.banned_until && Date.parse(caller.user.banned_until) > Date.now())) return json({ error: 'Hesap pasif.' }, 403);
  const { data: profile, error: profileError } = await admin.from('profiles').select('rol').eq('id', user.id).single();
  if (profileError || profile?.rol !== 'admin') return json({ error: 'Yalnızca admin işlem yapabilir.' }, 403);
  try {
    const body = await request.json();
    if (!['list', 'set'].includes(body.action)) return json({ error: 'Geçersiz işlem.' }, 400);
    if (body.action === 'set' && typeof body.active !== 'boolean') return json({ error: 'Aktif/pasif seçimi gerekli.' }, 400);
    if (body.user_id !== undefined && (typeof body.user_id !== 'string' || !body.user_id)) return json({ error: 'Geçersiz kullanıcı.' }, 400);
    if (body.action === 'set' && body.user_id === user.id) return json({ error: 'Kendi hesabınızı pasif yapamazsınız.' }, 400);
    const accounts = [];
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      accounts.push(...data.users);
      if (data.users.length < 1000) break;
    }
    // Sadece bu uygulamada profili bulunan hesaplara dokun.
    const profileIds = new Set<string>();
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.from('profiles').select('id').order('id').range(offset, offset + 999);
      if (error) throw error;
      data.forEach(row => profileIds.add(row.id));
      if (data.length < 1000) break;
    }
    const appAccounts = accounts.filter(account => profileIds.has(account.id));
    const active = account => !account.banned_until || Date.parse(account.banned_until) <= Date.now();
    if (body.action === 'list') return json({ statuses: Object.fromEntries(appAccounts.map(account => [account.id, active(account)])) });
    const targets = appAccounts.filter(account => account.id !== user.id && (!body.user_id || account.id === body.user_id));
    if (body.user_id && !targets.length) return json({ error: 'Kullanıcı bulunamadı.' }, 404);
    let updated = 0;
    const errors = [];
    for (const target of targets) {
      const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: body.active ? 'none' : '876000h' });
      if (error) errors.push(`${target.id}: ${error.message}`);
      else updated++;
    }
    return json({ updated, errors });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'İşlem başarısız.' }, 500); }
});
