import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/manage-user-status/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*createClient.*;$/m, '');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;

function setup({ role = 'admin', banned = false, failedId } = {}) {
  let handler;
  const updates = [];
  const accounts = [{ id: 'self' }, { id: 'one' }, { id: 'two', banned_until: '2099-01-01' }, { id: 'other-app' }];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'self' } } }),
      admin: {
        getUserById: async () => ({ data: { user: { id: 'self', banned_until: banned ? '2099-01-01' : null } } }),
        listUsers: async () => ({ data: { users: accounts } }),
        updateUserById: async (id, values) => { updates.push({ id, ...values }); return { error: id === failedId ? { message: 'Test failure' } : null }; },
      },
    },
    from: () => ({ select: () => ({
      eq: () => ({ single: async () => ({ data: { rol: role } }) }),
      order: () => ({ range: async () => ({ data: [{ id: 'self' }, { id: 'one' }, { id: 'two' }] }) }),
    }) }),
  };
  vm.runInNewContext(code, { createClient: () => client, Response, Date, Deno: { env: { get: () => 'test' }, serve: fn => { handler = fn; } } });
  const call = (body, auth = true) => handler(new Request('https://example.test/status', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer test' } : {}) }, body: JSON.stringify(body),
  }));
  return { call, updates };
}

test('oturumsuz, öğretmen ve pasif admin durum yönetimine erişemez', async () => {
  assert.equal((await setup().call({ action: 'list' }, false)).status, 401);
  assert.equal((await setup({ role: 'teacher' }).call({ action: 'list' })).status, 403);
  assert.equal((await setup({ banned: true }).call({ action: 'list' })).status, 403);
});
test('yalnızca uygulama kullanıcılarını listeler', async () => {
  const response = await setup().call({ action: 'list' });
  assert.deepEqual(await response.json(), { statuses: { self: true, one: true, two: false } });
});
test('toplu pasifleştirmede kendi hesabını ve diğer uygulama hesaplarını korur', async () => {
  const { call, updates } = setup();
  const response = await call({ action: 'set', active: false });
  assert.deepEqual(await response.json(), { updated: 2, errors: [] });
  assert.deepEqual(updates.map(update => update.id), ['one', 'two']);
  assert.ok(updates.every(update => update.ban_duration === '876000h'));
});
test('tek hesabı aktif yapar, kendi hesabı ve geçersiz girdiyi reddeder', async () => {
  const { call, updates } = setup();
  assert.equal((await call({ action: 'set', active: true, user_id: 'two' })).status, 200);
  assert.equal(updates[0].ban_duration, 'none');
  assert.equal((await call({ action: 'set', active: false, user_id: 'self' })).status, 400);
  assert.equal((await call({ action: 'set', active: 'false' })).status, 400);
  assert.equal((await call({ action: 'set', active: false, user_id: 'other-app' })).status, 404);
});
test('kısmi başarısızlıkları başarılı hesaplardan ayırır', async () => {
  const response = await setup({ failedId: 'two' }).call({ action: 'set', active: false });
  assert.deepEqual(await response.json(), { updated: 1, errors: ['two: Test failure'] });
});
