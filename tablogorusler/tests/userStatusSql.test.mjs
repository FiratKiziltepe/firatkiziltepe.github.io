import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const install = readFileSync(new URL('../supabase/install-user-status.sql', import.meta.url), 'utf8');
const adminId = '00000000-0000-0000-0000-000000000001';
const teacherId = '00000000-0000-0000-0000-000000000002';
const bannedId = '00000000-0000-0000-0000-000000000003';
const foreignId = '00000000-0000-0000-0000-000000000004';
const secondAdminId = '00000000-0000-0000-0000-000000000005';

test('SQL kurulumu ve gerçek PostgreSQL yetki kontrolleri', async t => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create function auth.uid() returns uuid language sql as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      create table auth.users (id uuid primary key, banned_until timestamptz, updated_at timestamptz);
      create table public.profiles (id uuid primary key, rol text);
      alter table public.profiles enable row level security;
      insert into auth.users(id, banned_until) values
        ('${adminId}', null), ('${teacherId}', null), ('${bannedId}', '2099-01-01'),
        ('${foreignId}', null), ('${secondAdminId}', null);
      insert into public.profiles values ('${adminId}', 'admin'), ('${teacherId}', 'teacher'),
        ('${bannedId}', 'admin'), ('${secondAdminId}', 'admin');
    `);
    await db.exec(install);
    // İkinci kurulum var olan hesapları ve durumları korumalı.
    await db.exec(install);
    const call = async (userId, action, active = null, targetId = null, role = 'authenticated') => {
      await db.exec(`begin; set local role ${role};`);
      try {
        await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId || '']);
        const response = await db.query('select public.manage_user_status($1, $2, $3) as result', [action, active, targetId]);
        await db.exec('commit');
        return response.rows[0].result;
      } catch (error) { await db.exec('rollback'); throw error; }
    };
    await t.test('kurulum hesapları değiştirmez ve liste uygulama profilleriyle sınırlıdır', async () => {
      const result = await call(adminId, 'list');
      assert.deepEqual(result.statuses, { [adminId]: true, [teacherId]: true, [bannedId]: false, [secondAdminId]: true });
    });
    await t.test('anon, oturumsuz, öğretmen ve pasif admin reddedilir', async () => {
      await assert.rejects(call(null, 'list', null, null, 'anon'), /permission denied/);
      await assert.rejects(call(null, 'list'), /Oturum gerekli/);
      await assert.rejects(call(teacherId, 'set', false), /aktif admin/);
      await assert.rejects(call(bannedId, 'list'), /aktif admin/);
    });
    await t.test('özel işleve anon erişemez ve tarayıcı rolüne auth.users yetkisi verilmez', async () => {
      const { rows } = await db.query(`select
        has_function_privilege('anon', 'public.manage_user_status(text,boolean,uuid)', 'execute') as public_access,
        has_function_privilege('anon', 'tablogorusler_private.manage_user_status(text,boolean,uuid)', 'execute') as private_access,
        has_table_privilege('authenticated', 'auth.users', 'update') as direct_update`);
      assert.deepEqual(rows[0], { public_access: false, private_access: false, direct_update: false });
    });
    await t.test('kendi hesabı, bilinmeyen kullanıcı ve geçersiz girdiler reddedilir', async () => {
      await assert.rejects(call(adminId, 'set', false, adminId), /Kendi hesab/);
      await assert.rejects(call(adminId, 'set', false, foreignId), /Kullanıcı bulunamadı/);
      await assert.rejects(call(adminId, 'set'), /seçimi gerekli/);
      await assert.rejects(call(adminId, null), /Geçersiz işlem/);
    });
    await t.test('toplu pasifleştirme kendi hesabını ve diğer uygulama hesabını korur', async () => {
      assert.equal((await call(adminId, 'set', false)).updated, 3);
      const result = await call(adminId, 'list');
      assert.equal(result.statuses[adminId], true);
      assert.equal(result.statuses[teacherId], false);
      const { rows } = await db.query('select banned_until from auth.users where id = $1', [foreignId]);
      assert.equal(rows[0].banned_until, null);
      await assert.rejects(call(secondAdminId, 'set', false), /aktif admin/);
    });
    await t.test('tek hesap ve tüm hesaplar yeniden aktif yapılabilir', async () => {
      assert.equal((await call(adminId, 'set', true, teacherId)).updated, 1);
      assert.equal((await call(adminId, 'list')).statuses[teacherId], true);
      assert.equal((await call(adminId, 'list')).statuses[bannedId], false);
      assert.equal((await call(adminId, 'set', true)).updated, 3);
      assert.ok(Object.values((await call(adminId, 'list')).statuses).every(Boolean));
    });
  } finally { await db.close(); }
});
