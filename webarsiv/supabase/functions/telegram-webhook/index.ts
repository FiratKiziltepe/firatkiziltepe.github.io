type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
}

type TelegramMessage = {
  message_id: number
  text?: string
  caption?: string
  entities?: TelegramEntity[]
  caption_entities?: TelegramEntity[]
  from?: {
    id: number
  }
  chat: {
    id: number
  }
}

type TelegramEntity = {
  type: string
  offset: number
  length: number
  url?: string
}

type GeminiAnalysis = {
  title: string
  summary: string
  category: string
  tags: string[]
  source: string
}

type SavedItemPayload = {
  telegram_user_id?: number | null
  telegram_message_id?: number | null
  title: string
  original_text: string
  personal_note: string
  url: string
  summary: string
  category: string
  tags: string[]
  source: string
  is_favorite: boolean
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const corsHeaders = {
  'Access-Control-Allow-Headers':
    'authorization, content-type, x-client-info, apikey, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action) {
      return await handleWebApi(request, url)
    }

    return await handleTelegramWebhook(request)
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message =
      error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'

    return json({ error: message }, status)
  }
})

async function handleWebApi(request: Request, url: URL): Promise<Response> {
  requireWebAccess(request)

  const action = url.searchParams.get('action')
  const method = request.method as HttpMethod

  if (action === 'list' && method === 'GET') {
    const items = await supabaseRpc<SavedItemPayload[]>('search_saved_items', {
      search_query: url.searchParams.get('search') ?? '',
      category_filter: url.searchParams.get('category') ?? '',
      source_filter: url.searchParams.get('source') ?? '',
      favorites_only: url.searchParams.get('favorites') === 'true',
    })
    const filterRows = await supabaseRest<Array<{ category: string; source: string }>>(
      'saved_items?select=category,source',
      { method: 'GET' },
    )

    return json({
      items,
      filters: {
        categories: uniqueSorted(filterRows.map((row) => row.category)),
        sources: uniqueSorted(filterRows.map((row) => row.source)),
      },
    })
  }

  if (action === 'create' && method === 'POST') {
    const payload = normalizeWebPayload(await request.json())
    const [item] = await supabaseRest<SavedItemPayload[]>(
      'saved_items?select=*',
      {
        body: JSON.stringify(payload),
        headers: { Prefer: 'return=representation' },
        method: 'POST',
      },
    )

    return json({ item }, 201)
  }

  if (action === 'update' && method === 'PATCH') {
    const id = requireId(url)
    const payload = normalizeWebPayload(await request.json(), true)
    const [item] = await supabaseRest<SavedItemPayload[]>(
      `saved_items?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        body: JSON.stringify(payload),
        headers: { Prefer: 'return=representation' },
        method: 'PATCH',
      },
    )

    if (!item) {
      throw new HttpError(404, 'Kayıt bulunamadı.')
    }

    return json({ item })
  }

  if (action === 'delete' && method === 'DELETE') {
    const id = requireId(url)
    await supabaseRest(
      `saved_items?id=eq.${encodeURIComponent(id)}`,
      { headers: { Prefer: 'return=minimal' }, method: 'DELETE' },
    )

    return json({ ok: true })
  }

  throw new HttpError(404, 'Geçersiz işlem.')
}

async function handleTelegramWebhook(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    throw new HttpError(405, 'Method not allowed.')
  }

  const webhookSecret = requireEnv('TELEGRAM_WEBHOOK_SECRET')
  const requestSecret = request.headers.get('x-telegram-bot-api-secret-token')
  if (requestSecret !== webhookSecret) {
    throw new HttpError(401, 'Unauthorized.')
  }

  const update = (await request.json()) as TelegramUpdate
  const message = update.message ?? update.edited_message

  if (!message) {
    return json({ ok: true, ignored: 'unsupported_update' })
  }

  const allowedUserId = Number(requireEnv('ALLOWED_TELEGRAM_USER_ID'))
  if (message.from?.id !== allowedUserId) {
    return json({ ok: true, ignored: 'unauthorized_user' })
  }

  const originalText = [message.text, message.caption]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('\n\n')
    .trim()
  const url = extractUrl(originalText, [
    ...(message.entities ?? []),
    ...(message.caption_entities ?? []),
  ])

  if (!url) {
    await sendTelegramMessage(
      message.chat.id,
      'Bağlantı bulunamadı. LinkedIn, X/Twitter veya Instagram URL’si gönder.',
    )
    return json({ ok: true, ignored: 'missing_url' })
  }

  const source = detectSource(url)
  if (!['instagram', 'linkedin', 'x'].includes(source)) {
    await sendTelegramMessage(
      message.chat.id,
      'Bu bağlantı desteklenmiyor. LinkedIn, X/Twitter veya Instagram URL’si gönder.',
    )
    return json({ ok: true, ignored: 'unsupported_source' })
  }

  const duplicate = await findTelegramDuplicate(
    allowedUserId,
    message.message_id,
  )
  if (duplicate) {
    await sendTelegramMessage(message.chat.id, 'Bu mesaj zaten arşivde.')
    return json({ ok: true, duplicate: true })
  }

  const analysis = await analyzeWithGemini({
    originalText,
    source,
    url,
  })
  const payload: SavedItemPayload = {
    telegram_user_id: allowedUserId,
    telegram_message_id: message.message_id,
    title: analysis.title,
    original_text: originalText,
    personal_note: '',
    url,
    summary: analysis.summary,
    category: analysis.category,
    tags: analysis.tags,
    source: analysis.source,
    is_favorite: false,
  }

  try {
    await supabaseRest('saved_items', {
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=minimal' },
      method: 'POST',
    })
  } catch (error) {
    if (isDuplicateError(error)) {
      await sendTelegramMessage(message.chat.id, 'Bu mesaj zaten arşivde.')
      return json({ ok: true, duplicate: true })
    }

    throw error
  }

  await sendTelegramMessage(
    message.chat.id,
    `Kaydedildi: ${analysis.title}`,
  )

  return json({ ok: true })
}

function requireWebAccess(request: Request) {
  const expectedToken = requireEnv('WEB_ACCESS_TOKEN')
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || token !== expectedToken) {
    throw new HttpError(401, 'Geçersiz erişim anahtarı.')
  }
}

function requireId(url: URL): string {
  const id = url.searchParams.get('id')?.trim()
  if (!id) {
    throw new HttpError(400, 'Kayıt kimliği gerekli.')
  }

  return id
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new HttpError(500, `${name} tanımlı değil.`)
  }

  return value
}

function normalizeWebPayload(
  value: unknown,
  partial = false,
): Partial<SavedItemPayload> {
  if (!value || typeof value !== 'object') {
    throw new HttpError(400, 'Geçersiz kayıt.')
  }

  const record = value as Record<string, unknown>
  const payload: Partial<SavedItemPayload> = {}

  assignString(payload, record, 'title')
  assignString(payload, record, 'original_text')
  assignString(payload, record, 'personal_note')
  assignString(payload, record, 'url')
  assignString(payload, record, 'summary')
  assignString(payload, record, 'category')
  assignString(payload, record, 'source')

  if (Array.isArray(record.tags)) {
    payload.tags = normalizeTags(record.tags)
  }

  if (typeof record.is_favorite === 'boolean') {
    payload.is_favorite = record.is_favorite
  }

  if (!partial) {
    payload.title = String(payload.title ?? '').trim()
    if (!payload.title) {
      throw new HttpError(400, 'Başlık gerekli.')
    }

    payload.original_text = String(payload.original_text ?? '')
    payload.personal_note = String(payload.personal_note ?? '')
    payload.url = String(payload.url ?? '')
    payload.summary = String(payload.summary ?? '')
    payload.category = String(payload.category ?? 'Genel') || 'Genel'
    payload.tags = payload.tags ?? []
    payload.source = String(payload.source ?? detectSource(payload.url)) || 'web'
    payload.is_favorite = payload.is_favorite ?? false
  }

  if (payload.url) {
    payload.source = payload.source || detectSource(payload.url)
  }

  return payload
}

function assignString(
  payload: Partial<SavedItemPayload>,
  record: Record<string, unknown>,
  key: keyof SavedItemPayload,
) {
  const value = record[key]
  if (typeof value === 'string') {
    payload[key] = value.trim() as never
  }
}

async function analyzeWithGemini(input: {
  originalText: string
  source: string
  url: string
}): Promise<GeminiAnalysis> {
  const apiKey = requireEnv('GEMINI_API_KEY')
  const model = requireEnv('GEMINI_MODEL')
  const prompt = [
    'Gönderilen sosyal medya içeriğini Türkçe analiz et.',
    'Sadece geçerli JSON döndür.',
    'JSON alanları: title, summary, category, tags, source.',
    'tags kısa Türkçe etiketlerden oluşan dizi olmalı.',
    `Kaynak: ${input.source}`,
    `URL: ${input.url}`,
    `Metin: ${input.originalText}`,
  ].join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new HttpError(502, 'Gemini analizi başarısız.')
  }

  const result = await response.json()
  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
  const parsed = parseJson(text)

  return {
    title: safeString(parsed.title) || fallbackTitle(input.url),
    summary: safeString(parsed.summary) || input.originalText.slice(0, 280),
    category: safeString(parsed.category) || 'Genel',
    tags: normalizeTags(parsed.tags).slice(0, 12),
    source: detectSource(input.url, safeString(parsed.source)),
  }
}

function parseJson(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') {
    return {}
  }

  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) {
      return {}
    }

    try {
      return JSON.parse(match[0])
    } catch {
      return {}
    }
  }
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTags(value: unknown): string[] {
  const rawTags = Array.isArray(value) ? value : []
  const seen = new Set<string>()

  return rawTags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase('tr-TR')
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

function extractUrl(text: string, entities: TelegramEntity[]): string | null {
  const entityUrl = entities.find((entity) => entity.type === 'text_link')?.url
  if (entityUrl) {
    return entityUrl
  }

  return text.match(/https?:\/\/[^\s<>"')]+/i)?.[0] ?? null
}

function detectSource(url: string, explicitSource = ''): string {
  const source = explicitSource.toLocaleLowerCase('tr-TR')
  if (['instagram', 'linkedin', 'x'].includes(source)) {
    return source
  }

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (hostname.includes('instagram.com')) {
      return 'instagram'
    }

    if (hostname.includes('linkedin.com')) {
      return 'linkedin'
    }

    if (hostname === 'x.com' || hostname.endsWith('.x.com')) {
      return 'x'
    }

    if (hostname.includes('twitter.com')) {
      return 'x'
    }
  } catch {
    return explicitSource || 'web'
  }

  return explicitSource || 'web'
}

function fallbackTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Başlıksız'
  }
}

async function findTelegramDuplicate(
  telegramUserId: number,
  telegramMessageId: number,
): Promise<boolean> {
  const rows = await supabaseRest<Array<{ id: string }>>(
    `saved_items?select=id&telegram_user_id=eq.${telegramUserId}&telegram_message_id=eq.${telegramMessageId}&limit=1`,
    { method: 'GET' },
  )

  return rows.length > 0
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = requireEnv('TELEGRAM_BOT_TOKEN')
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      text,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
}

async function supabaseRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  return await supabaseRest<T>(`rpc/${functionName}`, {
    body: JSON.stringify(body),
    method: 'POST',
  })
}

async function supabaseRest<T = unknown>(
  path: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const baseUrl = requireEnv('SUPABASE_URL')
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new HttpError(
      response.status,
      detail.includes('23505')
        ? 'Bu Telegram mesajı zaten arşivde.'
        : 'Veritabanı isteği başarısız.',
    )
  }

  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  if (!text) {
    return null as T
  }

  return JSON.parse(text) as T
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((first, second) =>
    first.localeCompare(second, 'tr-TR'),
  )
}

function isDuplicateError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('zaten arşivde')
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
    status,
  })
}
