const defaultAuthDomain = 'kantin.invalid'

export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '',
  authEmailDomain: import.meta.env.VITE_AUTH_EMAIL_DOMAIN?.trim() || defaultAuthDomain,
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
}

export const hasSupabaseConfig = Boolean(
  appConfig.supabaseUrl && appConfig.supabasePublishableKey,
)

export function normalizeUsername(username: string) {
  return username.trim().replaceAll('İ', 'i').replaceAll('I', 'i').toLowerCase()
}

export function usernameToEmail(username: string) {
  return `${normalizeUsername(username)}@${appConfig.authEmailDomain}`
}
