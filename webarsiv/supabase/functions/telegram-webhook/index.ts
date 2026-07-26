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
  document?: TelegramDocument
  from?: {
    id: number
  }
  photo?: TelegramPhotoSize[]
  chat: {
    id: number
  }
}

type TelegramDocument = {
  file_id: string
  file_name?: string
  file_size?: number
  mime_type?: string
}

type TelegramEntity = {
  type: string
  offset: number
  length: number
  url?: string
}

type TelegramFile = {
  file_id: string
  file_path?: string
  file_size?: number
}

type TelegramPhotoSize = {
  file_id: string
  file_size?: number
  height: number
  width: number
}

type GeminiAnalysis = {
  title: string
  summary: string
  category: string
  tags: string[]
  source: string
  usedFallback: boolean
}

type UrlMetadata = {
  title: string
  description: string
}

type SavedItemPayload = {
  id?: string
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
  screenshot_file_id?: string
  screenshot_mime_type?: string
  screenshot_path?: string
  screenshot_url?: string
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type ScreenshotUpload = {
  fileId: string
  mimeType: string
  path: string
}

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

const GEMINI_DEFAULT_MODEL = 'gemini-3.5-flash-lite'
const SCREENSHOT_BUCKET = 'webarsivi-screenshots'
const SCREENSHOT_SIGNED_URL_SECONDS = 60 * 60 * 24
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024

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
      error instanceof Error ? error.message : 'Beklenmeyen hata olustu.'

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
      items: await withScreenshotUrls(items),
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

    return json({ item: await withScreenshotUrl(item) }, 201)
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
      throw new HttpError(404, 'Kayit bulunamadi.')
    }

    return json({ item: await withScreenshotUrl(item) })
  }

  if (action === 'delete' && method === 'DELETE') {
    const id = requireId(url)
    await supabaseRest(
      `saved_items?id=eq.${encodeURIComponent(id)}`,
      { headers: { Prefer: 'return=minimal' }, method: 'DELETE' },
    )

    return json({ ok: true })
  }

  throw new HttpError(404, 'Gecersiz islem.')
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

  const originalText = [message.text, message.caption]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('\n\n')
    .trim()
  const senderId = message.from?.id
  const command = originalText.split(/\s+/)[0]?.toLocaleLowerCase('tr-TR')

  if (command === '/whoami' || command?.startsWith('/whoami@')) {
    await sendTelegramMessage(
      message.chat.id,
      [
        `Telegram ID: ${senderId ?? 'bilinmiyor'}`,
        'Supabase ALLOWED_TELEGRAM_USER_ID secret degerine sadece bu sayiyi yaz.',
      ].join('\n'),
    )
    return json({ ok: true, command: 'whoami' })
  }

  if (command === '/start' || command?.startsWith('/start@')) {
    await sendTelegramMessage(
      message.chat.id,
      [
        'Webarsivi hazir.',
        'Kaydetmek istedigin herhangi bir web baglantisini gonder.',
        `Telegram ID: ${senderId ?? 'bilinmiyor'}`,
      ].join('\n'),
    )
    return json({ ok: true, command: 'start' })
  }

  const allowedUserId = Number(requireEnv('ALLOWED_TELEGRAM_USER_ID').trim())
  if (!Number.isFinite(allowedUserId)) {
    await sendTelegramMessage(
      message.chat.id,
      [
        'ALLOWED_TELEGRAM_USER_ID Supabase secret degeri sadece sayi olmali.',
        '/whoami komutunda gorunen Telegram ID degerini gir.',
      ].join('\n'),
    )
    return json({ ok: true, ignored: 'invalid_allowed_user_id_secret' })
  }

  if (senderId !== allowedUserId) {
    await sendTelegramMessage(
      message.chat.id,
      [
        'Bu Telegram hesabi yetkili degil.',
        `Telegram ID: ${senderId ?? 'bilinmiyor'}`,
        'Supabase ALLOWED_TELEGRAM_USER_ID secret degerine sadece bu sayiyi yaz.',
      ].join('\n'),
    )
    return json({ ok: true, ignored: 'unauthorized_user' })
  }

  const url = extractUrl(originalText, [
    ...(message.entities ?? []),
    ...(message.caption_entities ?? []),
  ])

  if (!url) {
    await sendTelegramMessage(
      message.chat.id,
      'Baglanti bulunamadi. Kaydetmek istedigin web URL adresini gonder.',
    )
    return json({ ok: true, ignored: 'missing_url' })
  }

  const source = detectSource(url)
  const duplicate = await findTelegramDuplicate(
    allowedUserId,
    message.message_id,
  )
  if (duplicate) {
    await sendTelegramMessage(message.chat.id, 'Bu mesaj zaten arsivde.')
    return json({ ok: true, duplicate: true })
  }

  const analysis = await analyzeWithGemini({
    originalText,
    source,
    url,
  })
  const itemId = crypto.randomUUID()
  const screenshot = await saveTelegramScreenshot(
    message,
    allowedUserId,
    itemId,
  )
  const payload: SavedItemPayload = {
    id: itemId,
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
    screenshot_file_id: screenshot?.fileId ?? '',
    screenshot_mime_type: screenshot?.mimeType ?? '',
    screenshot_path: screenshot?.path ?? '',
  }

  try {
    await supabaseRest('saved_items', {
      body: JSON.stringify(payload),
      headers: { Prefer: 'return=minimal' },
      method: 'POST',
    })
  } catch (error) {
    if (isDuplicateError(error)) {
      await sendTelegramMessage(message.chat.id, 'Bu mesaj zaten arsivde.')
      return json({ ok: true, duplicate: true })
    }

    throw error
  }

  await sendTelegramMessage(
    message.chat.id,
    analysis.usedFallback
      ? `Kaydedildi (Gemini kullanilamadi): ${analysis.title}${screenshot ? ' + ekran goruntusu' : ''}`
      : `Kaydedildi: ${analysis.title}${screenshot ? ' + ekran goruntusu' : ''}`,
  )

  return json({ ok: true })
}

function requireWebAccess(request: Request) {
  const expectedToken = requireEnv('WEB_ACCESS_TOKEN')
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token || token !== expectedToken) {
    throw new HttpError(401, 'Gecersiz erisim anahtari.')
  }
}

function requireId(url: URL): string {
  const id = url.searchParams.get('id')?.trim()
  if (!id) {
    throw new HttpError(400, 'Kayit kimligi gerekli.')
  }

  return id
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new HttpError(500, `${name} tanimli degil.`)
  }

  return value
}

function normalizeWebPayload(
  value: unknown,
  partial = false,
): Partial<SavedItemPayload> {
  if (!value || typeof value !== 'object') {
    throw new HttpError(400, 'Gecersiz kayit.')
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
      throw new HttpError(400, 'Baslik gerekli.')
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
  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()
  const configuredModel = Deno.env.get('GEMINI_MODEL')?.trim()

  if (!apiKey) {
    return fallbackAnalysis(input)
  }

  const models = geminiModelCandidates(configuredModel)
  const metadata = await fetchUrlMetadata(input.url)
  const prompt = [
    'URL context aracini kullanarak URL icindeki asil gonderi veya sayfa metnini oku.',
    'Baslik, ozet, kategori ve etiketleri gonderinin icerigine gore Turkce yaz.',
    'Sadece domain adini, sosyal medya marka adini veya link onizleme basligini ozetleme.',
    'Eger URL icerigi erisilemiyorsa Telegram metni ve sayfa meta bilgisinden en iyi ozeti uret.',
    'Sadece gecerli JSON dondur. Markdown, aciklama veya kod blogu ekleme.',
    'JSON alanlari: title, summary, category, tags, source.',
    'title 6-12 kelimeyi gecmesin.',
    'summary 2-4 cumle olsun ve gonderide anlatilan somut bilgiyi icersin.',
    'category kisa Turkce kategori olsun.',
    'tags kisa Turkce etiketlerden olusan dizi olmali.',
    `Kaynak: ${input.source}`,
    `URL: ${input.url}`,
    metadata.title ? `Sayfa basligi: ${metadata.title}` : '',
    metadata.description ? `Sayfa aciklamasi: ${metadata.description}` : '',
    `Telegram metni: ${input.originalText}`,
  ].filter(Boolean).join('\n')

  for (const model of models) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        body: JSON.stringify({
          input: prompt,
          model,
          tools: [{ type: 'url_context' }],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        method: 'POST',
      })

      if (!response.ok) {
        console.warn('Gemini request failed', {
          model,
          status: response.status,
        })
        continue
      }

      const result = await response.json()
      const text = textFromGeminiInteraction(result)
      const parsed = parseJson(text)
      if (Object.keys(parsed).length === 0) {
        console.warn('Gemini response could not be parsed', { model })
        continue
      }

      return {
        title: safeString(parsed.title) || fallbackTitle(input.url),
        summary: safeString(parsed.summary) || input.originalText.slice(0, 280),
        category: safeString(parsed.category) || 'Genel',
        tags: normalizeTags(parsed.tags).slice(0, 12),
        source: detectSource(input.url, safeString(parsed.source)),
        usedFallback: false,
      }
    } catch (error) {
      console.warn('Gemini request errored', {
        message: error instanceof Error ? error.message : 'unknown',
        model,
      })
    }
  }

  return fallbackAnalysis(input)
}

function geminiModelCandidates(configuredModel: string | undefined): string[] {
  return uniqueInOrder([
    GEMINI_DEFAULT_MODEL,
    normalizeGeminiModel(configuredModel),
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
  ])
}

function normalizeGeminiModel(value: string | undefined): string {
  const model = value
    ?.trim()
    .replace(/^models\//i, '')
    .replace(/[_\s]+/g, '-')
    .toLocaleLowerCase('en-US')

  return model || GEMINI_DEFAULT_MODEL
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>()

  return values.filter((value) => {
    if (!value || seen.has(value)) {
      return false
    }

    seen.add(value)
    return true
  })
}

function fallbackAnalysis(input: {
  originalText: string
  source: string
  url: string
}): GeminiAnalysis {
  const title = fallbackTitle(input.url)
  const summary = input.originalText.slice(0, 280)

  return {
    title,
    summary,
    category: 'Genel',
    tags: [input.source].filter(Boolean),
    source: detectSource(input.url, input.source),
    usedFallback: true,
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

async function saveTelegramScreenshot(
  message: TelegramMessage,
  telegramUserId: number,
  itemId: string,
): Promise<ScreenshotUpload | null> {
  const candidate = screenshotCandidate(message)
  if (!candidate) {
    return null
  }

  try {
    const file = await getTelegramFile(candidate.fileId)
    if (!file.file_path) {
      return null
    }

    const bytes = await downloadTelegramFile(file.file_path)
    if (bytes.byteLength > SCREENSHOT_MAX_BYTES) {
      console.warn('Telegram screenshot skipped because it is too large')
      return null
    }

    const mimeType = normalizeImageMimeType(candidate.mimeType) ||
      mimeTypeFromPath(file.file_path)
    if (!mimeType) {
      console.warn('Telegram screenshot skipped because MIME type is not allowed')
      return null
    }

    const path = [
      String(telegramUserId),
      `${itemId}.${extensionFromMimeType(mimeType)}`,
    ].join('/')

    await uploadStorageObject(path, bytes, mimeType)
    return {
      fileId: candidate.fileId,
      mimeType,
      path,
    }
  } catch (error) {
    console.warn('Telegram screenshot upload failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }
}

function screenshotCandidate(
  message: TelegramMessage,
): { fileId: string; mimeType: string } | null {
  const photo = largestPhoto(message.photo ?? [])
  if (photo) {
    return { fileId: photo.file_id, mimeType: 'image/jpeg' }
  }

  const documentMimeType = normalizeImageMimeType(message.document?.mime_type)
  if (message.document?.file_id && documentMimeType) {
    return {
      fileId: message.document.file_id,
      mimeType: documentMimeType,
    }
  }

  return null
}

function largestPhoto(photos: TelegramPhotoSize[]): TelegramPhotoSize | null {
  return photos.reduce<TelegramPhotoSize | null>((best, photo) => {
    if (!best) {
      return photo
    }

    const bestScore = best.file_size ?? best.width * best.height
    const photoScore = photo.file_size ?? photo.width * photo.height
    return photoScore > bestScore ? photo : best
  }, null)
}

async function getTelegramFile(fileId: string): Promise<TelegramFile> {
  const token = requireEnv('TELEGRAM_BOT_TOKEN')
  const response = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  )

  if (!response.ok) {
    throw new Error('Telegram getFile failed')
  }

  const payload = asRecord(await response.json())
  if (payload.ok !== true) {
    throw new Error('Telegram getFile returned an error')
  }

  return asRecord(payload.result) as TelegramFile
}

async function downloadTelegramFile(filePath: string): Promise<Uint8Array> {
  const token = requireEnv('TELEGRAM_BOT_TOKEN')
  const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)

  if (!response.ok) {
    throw new Error('Telegram file download failed')
  }

  return new Uint8Array(await response.arrayBuffer())
}

async function uploadStorageObject(
  path: string,
  bytes: Uint8Array,
  mimeType: string,
) {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const baseUrl = requireEnv('SUPABASE_URL')
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${SCREENSHOT_BUCKET}/${encodeStoragePath(path)}`,
    {
      body: bytes,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Cache-Control': '31536000',
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error('Supabase Storage upload failed')
  }
}

async function withScreenshotUrls(
  items: SavedItemPayload[],
): Promise<SavedItemPayload[]> {
  return await Promise.all(items.map((item) => withScreenshotUrl(item)))
}

async function withScreenshotUrl(
  item: SavedItemPayload,
): Promise<SavedItemPayload> {
  const path = safeString(item.screenshot_path)
  if (!path) {
    return { ...item, screenshot_url: '' }
  }

  return {
    ...item,
    screenshot_url: await createStorageSignedUrl(path),
  }
}

async function createStorageSignedUrl(path: string): Promise<string> {
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const baseUrl = requireEnv('SUPABASE_URL')
  const response = await fetch(
    `${baseUrl}/storage/v1/object/sign/${SCREENSHOT_BUCKET}/${encodeStoragePath(path)}`,
    {
      body: JSON.stringify({ expiresIn: SCREENSHOT_SIGNED_URL_SECONDS }),
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    console.warn('Supabase Storage signed URL failed', { status: response.status })
    return ''
  }

  const payload = asRecord(await response.json())
  const signedPath =
    safeString(payload.signedURL) ||
    safeString(payload.signedUrl) ||
    safeString(payload.signed_url)

  if (!signedPath) {
    return ''
  }

  if (signedPath.startsWith('http')) {
    return signedPath
  }

  if (signedPath.startsWith('/storage/v1/')) {
    return `${baseUrl}${signedPath}`
  }

  return `${baseUrl}/storage/v1${signedPath.startsWith('/') ? '' : '/'}${signedPath}`
}

function encodeStoragePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function normalizeImageMimeType(value: string | undefined): string {
  const mimeType = value?.toLocaleLowerCase('en-US') ?? ''
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return mimeType
  }

  return ''
}

function mimeTypeFromPath(path: string): string {
  const lowerPath = path.toLocaleLowerCase('en-US')
  if (lowerPath.endsWith('.png')) {
    return 'image/png'
  }

  if (lowerPath.endsWith('.webp')) {
    return 'image/webp'
  }

  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
    return 'image/jpeg'
  }

  return ''
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') {
    return 'png'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

function textFromGeminiInteraction(value: unknown): string {
  const root = asRecord(value)
  const directText = safeString(root.output_text) || safeString(root.outputText)
  if (directText) {
    return directText
  }

  const textParts: string[] = []
  const steps = Array.isArray(root.steps) ? root.steps : []
  for (const step of steps) {
    const stepRecord = asRecord(step)
    const content = Array.isArray(stepRecord.content) ? stepRecord.content : []

    for (const block of content) {
      const blockRecord = asRecord(block)
      const text = safeString(blockRecord.text)
      if (text) {
        textParts.push(text)
      }
    }
  }

  return textParts.join('\n').trim()
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; WebarsiviBot/1.0)',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return emptyMetadata()
    }

    const contentType = response.headers.get('content-type')?.toLocaleLowerCase('en-US') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return emptyMetadata()
    }

    const html = (await response.text()).slice(0, 200_000)
    return {
      description: decodeHtmlEntities(metaContent(html, [
        'og:description',
        'twitter:description',
        'description',
      ])),
      title: decodeHtmlEntities(metaContent(html, [
        'og:title',
        'twitter:title',
      ]) || titleTag(html)),
    }
  } catch {
    return emptyMetadata()
  }
}

function emptyMetadata(): UrlMetadata {
  return { description: '', title: '' }
}

function metaContent(html: string, keys: string[]): string {
  const wanted = new Set(keys.map((key) => key.toLocaleLowerCase('en-US')))

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0]
    const key = (
      attributeValue(tag, 'property') ||
      attributeValue(tag, 'name')
    ).toLocaleLowerCase('en-US')

    if (!wanted.has(key)) {
      continue
    }

    const content = attributeValue(tag, 'content')
    if (content) {
      return content
    }
  }

  return ''
}

function titleTag(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return stripHtml(match?.[1] ?? '')
}

function attributeValue(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'),
  )

  return match?.[2] ?? match?.[3] ?? match?.[4] ?? ''
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ')
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_match, entity: string) => {
      const lower = entity.toLocaleLowerCase('en-US')
      if (lower.startsWith('#x')) {
        return codePointToString(Number.parseInt(lower.slice(2), 16))
      }

      if (lower.startsWith('#')) {
        return codePointToString(Number.parseInt(lower.slice(1), 10))
      }

      const named: Record<string, string> = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"',
      }

      return named[lower] ?? `&${entity};`
    })
    .replace(/\s+/g, ' ')
    .trim()
}

function codePointToString(codePoint: number): string {
  if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) {
    return ''
  }

  return String.fromCodePoint(codePoint)
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

  const match = text.match(/https?:\/\/\S+/i)?.[0]
  return match?.replace(/[).,;!?]+$/, '') ?? null
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
    return hostname
  } catch {
    return explicitSource || 'web'
  }
}

function fallbackTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Basliksiz'
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
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      text,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!response.ok) {
    throw new HttpError(502, 'Telegram mesaji gonderilemedi.')
  }
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
        ? 'Bu Telegram mesaji zaten arsivde.'
        : 'Veritabani istegi basarisiz.',
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
  return error instanceof Error && error.message.includes('zaten arsivde')
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
