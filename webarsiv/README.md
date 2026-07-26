# Webarşivi

## Manuel Adımlar

1. Supabase Edge Function secret'larını ekle:

   ```bash
   supabase secrets set TELEGRAM_BOT_TOKEN=<telegram-bot-token>
   supabase secrets set TELEGRAM_WEBHOOK_SECRET=<rastgele-gizli-webhook-degeri>
   supabase secrets set ALLOWED_TELEGRAM_USER_ID=<izinli-telegram-user-id>
   supabase secrets set GEMINI_API_KEY=<gemini-api-key>
   supabase secrets set GEMINI_MODEL=<gemini-model-adi>
   supabase secrets set WEB_ACCESS_TOKEN=<web-arayuzu-kisisel-erisim-anahtari>
   ```

2. Telegram webhook'unu ayarla:

   ```bash
   curl -X POST "https://api.telegram.org/bot<telegram-bot-token>/setWebhook" \
     -d "url=https://knqfsmpglknckrojwefo.supabase.co/functions/v1/telegram-webhook" \
     -d "secret_token=<rastgele-gizli-webhook-degeri>"
   ```

3. GitHub Pages kaynağını repository settings içinde Actions olarak ayarla ve `Deploy Webarşivi to GitHub Pages` workflow'unu çalıştır.

4. Web arayüzünde `WEB_ACCESS_TOKEN` olarak belirlediğin kişisel erişim anahtarını gir.
