export type NasUser = { id: string };
export type NasSession = { user: NasUser; access_token: string };
type ApiResult = { data: any; error: { message: string; code?: string } | null };
type Listener = (event: string, session: NasSession | null) => void;
const listeners = new Set<Listener>();
let currentSession: NasSession | null = null;
export const API_BASE = new URL('./api/index.php', window.location.href).href;

export async function request(action: string, body: Record<string, unknown> = {}): Promise<any> {
  const response = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(currentSession ? { 'X-CSRF-Token': currentSession.access_token } : {}) },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({ error: 'Sunucu geçerli JSON döndürmedi. PHP kurulumunu kontrol edin.' }));
  if (!response.ok) {
    if (response.status === 401 && currentSession) setSession(null);
    throw Object.assign(new Error(result.error || 'İşlem tamamlanamadı.'), { code: result.code });
  }
  return result;
}
function setSession(session: NasSession | null) {
  currentSession = session;
  listeners.forEach(listener => listener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
}
async function resultOf(operation: () => Promise<any>): Promise<ApiResult> {
  try { return { data: await operation(), error: null }; }
  catch (error: any) { return { data: null, error: { message: error.message, code: error.code } }; }
}
class Query implements PromiseLike<ApiResult> {
  private body: Record<string, any>;
  private pending?: Promise<ApiResult>;
  constructor(table: string) { this.body = { table, operation: 'select', filters: [] }; }
  select(_columns = '*') { this.body.returning = true; return this; }
  insert(values: unknown) { this.body.operation = 'insert'; this.body.values = values; return this; }
  update(values: unknown) { this.body.operation = 'update'; this.body.values = values; return this; }
  delete() { this.body.operation = 'delete'; return this; }
  eq(column: string, value: unknown) { this.body.filters.push({ column, operator: 'eq', value }); return this; }
  neq(column: string, value: unknown) { this.body.filters.push({ column, operator: 'neq', value }); return this; }
  in(column: string, value: unknown[]) { this.body.filters.push({ column, operator: 'in', value }); return this; }
  order(column: string, options: { ascending: boolean }) { this.body.order = { column, ascending: options.ascending }; return this; }
  range(from: number, to: number) { this.body.offset = from; this.body.limit = to - from + 1; return this; }
  limit(limit: number) { this.body.limit = limit; return this; }
  single() { this.body.single = true; return this; }
  then<TResult1 = ApiResult, TResult2 = never>(
    onfulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.pending ??= resultOf(() => request('query', this.body));
    return this.pending.then(onfulfilled, onrejected);
  }
}
export const nas = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: Record<string, unknown>) => resultOf(() => request(name, args)),
  auth: {
    getSession: async () => {
      try {
        const result = await request('session');
        setSession(result.session);
        return { data: { session: currentSession }, error: null };
      } catch (error: any) { return { data: { session: null }, error: { message: error.message } }; }
    },
    refreshSession: async () => nas.auth.getSession(),
    onAuthStateChange: (listener: Listener) => {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try { const result = await request('login', { username: email.replace(/@tablogorusler\.local$/, ''), password }); setSession(result.session); return { error: null }; }
      catch (error: any) { return { error: { message: error.message } }; }
    },
    signOut: async () => { await request('logout'); setSession(null); },
  },
};
