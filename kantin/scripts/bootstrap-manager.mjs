import { createClient } from '@supabase/supabase-js'

const [usernameArg, displayNameArg, password] = process.argv.slice(2)
const username = usernameArg?.trim().replaceAll('İ', 'i').replaceAll('I', 'i').toLowerCase()
const displayName = displayNameArg?.trim()
const supabaseUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const emailDomain = process.env.AUTH_EMAIL_DOMAIN || 'kantin.invalid'

if (!supabaseUrl || !secretKey) {
  console.error('SUPABASE_URL ve SUPABASE_SECRET_KEY ortam değişkenleri gereklidir.')
  process.exit(1)
}

if (!username || !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username) || !displayName || !password || password.length < 8) {
  console.error('Kullanım: npm run bootstrap-manager -- kullaniciadi "Ad Soyad" "EnAz8Karakter"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data, error } = await supabase.auth.admin.createUser({
  email: `${username}@${emailDomain}`,
  password,
  email_confirm: true,
  app_metadata: { role: 'canteen', is_manager: true },
  user_metadata: { display_name: displayName },
})

if (error || !data.user) {
  console.error(error?.message || 'Auth kullanıcısı oluşturulamadı.')
  process.exit(1)
}

const { error: profileError } = await supabase.from('profiles').insert({
  id: data.user.id,
  username,
  display_name: displayName,
  role: 'canteen',
  is_manager: true,
  is_active: true,
  must_change_password: true,
})

if (profileError) {
  await supabase.auth.admin.deleteUser(data.user.id)
  console.error(profileError.message)
  process.exit(1)
}

console.log(`Yönetici kantinci oluşturuldu: ${username}`)
