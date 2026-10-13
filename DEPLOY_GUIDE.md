# 🚀 LED Tannarx Telegram Mini App — Bepul Servislarga Deploy Qilish Qoʻllanmasi

Telegram Mini App ishlashi uchun **HTTPS (SSL)** majburiy talab qilinadi. Quyida ilovani 100% bepul serverlarga joylashtirishning eng yaxshi 3 ta usuli keltirilgan.

---

## 🥇 1-USUL: Render.com (Eng oson va tavsiya etiladigan)

**Render.com** har oy bepul 750 soat ishchi vaqt va avtomatik bepul `https://...onrender.com` SSL domen beradi.

### 🐘 1-qadam: Neon.tech da Bepul PostgreSQL baza ochish (1 daqiqada)
1. [Neon.tech](https://neon.tech) saytiga kiring va GitHub yoki Google orqali kiring.
2. **"Create Project"** tugmasini bosing:
   - Project name: `led-tannarx`
   - Region: `Frankfurt (eu-central-1)` (Oʻzbekistonga eng tez server)
3. Dashboardda sizga darhol **Connection string** beriladi, masalan:
   ```
   postgresql://neondb_owner:parol@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Ushbu havolani nusxalab oling (Copy). Bu sizning `DATABASE_URL` qiymatingiz boʻladi.

---

### 2-qadam: Kodni GitHub'ga yuklash
Terminalda (yoki VS Code / Git da):
```bash
git add .
git commit -m "feat: add Neon.tech PostgreSQL cloud support"
git push -u origin main
```

### 3-qadam: Render.com da yangi Web Service yaratish
1. [Render.com](https://render.com) saytiga kiring va GitHub orqali roʻyxatdan oʻting.
2. **"New +"** tugmasini bosib, **"Web Service"** ni tanlang.
3. GitHub repozitoriyingizni tanlang (`led-tannarx`).
4. Quyidagi parametrlarni kiriting:
   - **Name:** `led-tannarx` (yoki ixtiyoriy nom)
   - **Region:** `Frankfurt (EU Central)`
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run seed`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` ($0/month)
5. **Environment Variables** (Muhit oʻzgaruvchilari) boʻlimiga kiring va qoʻshing:
   - `DATABASE_URL`: Neon.tech dan nusxalangan havola
   - `BOT_TOKEN`: Telegram bot tokeningiz (masalan: `712345678:AA...`)
   - `WEBAPP_URL`: Render sizga beradigan domen (masalan: `https://led-tannarx.onrender.com`)
6. **"Deploy Web Service"** tugmasini bosing!

1-2 daqiqada sizga bepul `https://led-tannarx.onrender.com` manzili beriladi va ilova 24/7 ishlay boshlaydi!

---

## 🥈 2-USUL: Koyeb.com (Tezkor va zamonaviy bepul hosting)

[Koyeb.com](https://www.koyeb.com) ham bepul "Eco/Free" tarifiga ega va Node.js loyihalarni juda tez deploy qiladi.

1. [Koyeb.com](https://www.koyeb.com) ga kiring.
2. **"Create App"** -> **"GitHub"** ni tanlang.
3. Loyihangizni tanlang. Loyihada allaqachon tayyor [`Dockerfile`](file:///c:/Users/bekbo/Desktop/tannarx_webapp/Dockerfile) mavjud, shuning uchun Koyeb uni avtomatik aniqlaydi.
4. Environment variables ga `BOT_TOKEN` va `WEBAPP_URL` ni kiriting.
5. **"Deploy"** tugmasini bosing. Sizga bepul `https://...koyeb.app` domeni beriladi.

---

## 🥉 3-USUL: Localtunnel yoki Cloudflare Tunnels (Hech qayerga yuklamasdan, hozirning oʻzida sinab koʻrish)

Agar loyihani hozircha GitHub yoki serverga yuklamasdan, **oʻz kompyuteringizdan turib Telegramda jonli ochmoqchi boʻlsangiz**:

### A) Localtunnel (Oʻrnatish shart emas, 1 ta buyruq):
Kompyuteringiz terminalida alohida oynada ishga tushiring:
```bash
npx localtunnel --port 3000
```
Natijada sizga tayyor `https://xxxxxx.loca.lt` koʻrinishidagi bepul HTTPS havola beriladi!

### B) Cloudflare Tunnel (Tez va cheklovlarsiz):
```bash
npx untun tunnel --port 3000
```
Sizga darhol `https://xxxxxx.trycloudflare.com` havolasi beriladi!

---

## 🤖 Telegram Botda Mini App'ni ulash (BotFather orqali)

Domen havolasini olganingizdan keyin (`https://sizning-sayt.onrender.com`):

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/mybots` buyrugʻini yuboring va botingizni tanlang.
3. **"Bot Settings"** -> **"Menu Button"** -> **"Configure menu button"** ni bosing.
4. Saytingiz HTTPS havolasini yuboring:
   `https://sizning-sayt.onrender.com`
5. Tugma nomiga yozing: `💡 Tannarx App`

Endi istalgan foydalanuvchi botingizga kirganda, pastki chap burchakda **"💡 Tannarx App"** tugmasi paydo boʻladi va toʻgʻridan-toʻgʻri Telegram ichida chiroyli oynada ochiladi!
