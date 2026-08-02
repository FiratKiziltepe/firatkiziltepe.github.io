import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

type AppRole = 'customer' | 'canteen'

type RequestBody =
  | {
      action: 'create'
      username: string
      displayName: string
      password: string
      role: AppRole
      isManager?: boolean
    }
  | { action: 'reset_password'; userId: string; password: string }
  | { action: 'set_active'; userId: string; isActive: boolean }
  | { action: 'update_profile'; userId: string; displayName: string }
  | { action: 'change_own_password'; password: string }

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,31}$/

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

function normalizeUsername(value: string) {
  return value.trim().replaceAll('İ', 'i').replaceAll('I', 'i').toLowerCase()
}

function validatePassword(password: string) {
  if (password.length < 8) throw new Error('Parola en az 8 karakter olmalıdır.')
  if (password.length > 72) throw new Error('Parola en fazla 72 karakter olabilir.')
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return jsonError('Yalnızca POST isteği desteklenir.', 405)

    const callerId = ctx.userClaims?.id
    if (!callerId) return jsonError('Oturum doğrulanamadı.', 401)

    let body: RequestBody
    try {
      body = (await req.json()) as RequestBody
    } catch {
      return jsonError('Geçersiz istek gövdesi.')
    }

    const { data: caller, error: callerError } = await ctx.supabase
      .from('profiles')
      .select('id, role, is_manager, is_active')
      .eq('id', callerId)
      .single()

    if (callerError || !caller?.is_active) return jsonError('Aktif kullanıcı bulunamadı.', 403)

    try {
      if (body.action === 'change_own_password') {
        validatePassword(body.password)
        const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(callerId, {
          password: body.password,
        })
        if (authError) throw authError

        const { error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', callerId)
        if (profileError) throw profileError

        await ctx.supabaseAdmin.from('audit_events').insert({
          actor_id: callerId,
          action: 'password_changed',
          entity_type: 'profile',
          entity_id: callerId,
        })
        return Response.json({ ok: true })
      }

      if (caller.role !== 'canteen') return jsonError('Bu işlem için kantinci yetkisi gerekir.', 403)

      if (body.action === 'create') {
        const username = normalizeUsername(body.username)
        const displayName = body.displayName.trim()
        const role = body.role
        const isManager = role === 'canteen' && Boolean(body.isManager)

        if (!usernamePattern.test(username)) {
          return jsonError('Kullanıcı adı 3-32 karakter olmalı; yalnızca küçük harf, rakam, nokta, tire ve alt çizgi içermelidir.')
        }
        if (displayName.length < 2 || displayName.length > 80) return jsonError('Ad soyad 2-80 karakter olmalıdır.')
        validatePassword(body.password)
        if (role === 'canteen' && !caller.is_manager) return jsonError('Kantinci hesabını yalnızca yönetici kantinci oluşturabilir.', 403)
        if (isManager && !caller.is_manager) return jsonError('Yönetici yetkisini yalnızca başka bir yönetici verebilir.', 403)

        const domain = Deno.env.get('AUTH_EMAIL_DOMAIN') ?? 'kantin.invalid'
        const { data: authData, error: authError } = await ctx.supabaseAdmin.auth.admin.createUser({
          email: `${username}@${domain}`,
          password: body.password,
          email_confirm: true,
          app_metadata: { role, is_manager: isManager },
          user_metadata: { display_name: displayName },
        })
        if (authError || !authData.user) throw authError ?? new Error('Kullanıcı oluşturulamadı.')

        const { error: profileError } = await ctx.supabaseAdmin.from('profiles').insert({
          id: authData.user.id,
          username,
          display_name: displayName,
          role,
          is_manager: isManager,
          is_active: true,
          must_change_password: true,
          created_by: callerId,
        })
        if (profileError) {
          await ctx.supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          throw profileError
        }

        await ctx.supabaseAdmin.from('audit_events').insert({
          actor_id: callerId,
          action: 'user_created',
          entity_type: 'profile',
          entity_id: authData.user.id,
          details: { username, role, is_manager: isManager },
        })
        return Response.json({ ok: true, userId: authData.user.id })
      }

      const { data: target, error: targetError } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id, role, is_manager')
        .eq('id', body.userId)
        .single()
      if (targetError || !target) return jsonError('Kullanıcı bulunamadı.', 404)
      if (target.role === 'canteen' && !caller.is_manager) return jsonError('Kantinci hesaplarını yalnızca yönetici düzenleyebilir.', 403)

      if (body.action === 'reset_password') {
        validatePassword(body.password)
        const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(body.userId, {
          password: body.password,
        })
        if (authError) throw authError
        await ctx.supabaseAdmin.from('profiles').update({ must_change_password: true }).eq('id', body.userId)
        await ctx.supabaseAdmin.from('audit_events').insert({
          actor_id: callerId,
          action: 'password_reset',
          entity_type: 'profile',
          entity_id: body.userId,
        })
        return Response.json({ ok: true })
      }

      if (body.action === 'set_active') {
        if (body.userId === callerId && !body.isActive) return jsonError('Kendi hesabınızı devre dışı bırakamazsınız.')
        const { error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .update({ is_active: body.isActive })
          .eq('id', body.userId)
        if (profileError) throw profileError

        const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(body.userId, {
          ban_duration: body.isActive ? 'none' : '876000h',
        })
        if (authError) throw authError

        await ctx.supabaseAdmin.from('audit_events').insert({
          actor_id: callerId,
          action: body.isActive ? 'user_activated' : 'user_deactivated',
          entity_type: 'profile',
          entity_id: body.userId,
        })
        return Response.json({ ok: true })
      }

      if (body.action === 'update_profile') {
        const displayName = body.displayName.trim()
        if (displayName.length < 2 || displayName.length > 80) return jsonError('Ad soyad 2-80 karakter olmalıdır.')
        const { error: profileError } = await ctx.supabaseAdmin
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', body.userId)
        if (profileError) throw profileError
        await ctx.supabaseAdmin.auth.admin.updateUserById(body.userId, {
          user_metadata: { display_name: displayName },
        })
        return Response.json({ ok: true })
      }

      return jsonError('Bilinmeyen işlem.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem tamamlanamadı.'
      return jsonError(message, 400)
    }
  }),
}
