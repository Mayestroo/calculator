# 💡 LED Chiroq Tannarxini Hisoblash — Telegram Mini App (Web App)

Ushbu loyiha LED chiroq ishlab chiqaruvchi korxonalar uchun **Texnik topshiriq (TZ)** talablariga toʻliq mos holda ishlab chiqilgan professional **Telegram Mini App** tizimidir. Tizim Excel jadvallariga boʻlgan ehtiyojni yoʻqotadi va xom-ashyo narxlari asosida 1 dona chiroq hamda butun partiyaning tannarxini va tavsiya etilgan sotish narxini real vaqtda hisoblab beradi.

---

## 🚀 Asosiy Imkoniyatlar

1. **⚡ Jonli Real-Vaqt Kalkulyatori:**
   - **Korpus (Profil):** Model tanlash (masalan, `50/35 PC`, `100/75 PC`), modelga mos ranglar dinamik chiqishi (`QORA MATT`, `OQ MATT`, `DEREVO OREH`, `TEKSTURA KOJA`), 1 metr narxining avtomatik toʻldirilishi, uzunlikni kiritish.
   - **LED Lenta:** Turini tanlash (12V, 24V, 220V, COB, Lupali, 6500K, 4000K), birlik (metr/dona), miqdorni kiritish.
   - **Quvvat Bloki (Drayver):** Turini tanlash (60W, 100W, 200W, 300W, Palochka, Simsiz), sonini kiritish.
   - **Qoʻshimcha Xarajatlar:** Dinamik roʻyxat (zaglushka/qopqoq, sim va vilka, qadoq, ish haqi, elektr). Istalgan qatorni qoʻshish, tahrirlash yoki oʻchirish.
   - **Narxlarni Qoʻlda Oʻzgartirish (Override):** Avtomatik chiqqan har bir narxni faqat shu hisob uchun oʻzgartirish mumkin (bazadagi narxga taʼsir qilmaydi).

2. **📊 Hisoblash Formulalari (TZ ga 100% mos):**
   - $Material = Korpus + LED + Blok + Qo'shimcha$
   - $Brak = Material \times \frac{Brak\%}{100}$
   - $Tannarx = Material + Brak$ (1 dona uchun, $ va soʻmda)
   - $Sotish\_Narxi = Tannarx \times (1 + \frac{Foyda\%}{100})$
   - **Partiya hisobi:** Partiya tannarxi, umumiy tushum va sof foyda.

3. **💾 Saqlash, Kvitansiya va Ulashish:**
   - Hisob-kitobni nom bilan saqlash (masalan: `100/75 PC OQ MATT (1.5m) + 60W Blok`).
   - Saqlangan hisoblarni istalgan payt ochish, qayta hisoblash, nusxalash va oʻchirish.
   - **Telegramga Yuborish:** Chiroyli emoji va jadval bilan formatlangan hisobot xabari.
   - **Kvitansiya / Chek:** Chop etish yoki PDF formatida yuklab olish imkoniyati.

4. **🛡️ Admin Panel:**
   - Korpus, LED va Blok xom-ashyolarini koʻrish, qoʻshish, tahrirlash, oʻchirish.
   - **Narx oʻzgarishlari tarixi (Audit Log):** Kim, qachon, eski narx, yangi narx jurnali.
   - **Excel Boshqaruvi:** `.xlsx` faylni bir bosish bilan yuklash (Import) va hozirgi bazani Excel qilib yuklab olish (Export).
   - **Foydalanuvchilar va Rollar:** Telegram ID orqali Admin va Menejer ruxsatlarini boshqarish.
   - **Standart Sozlamalar:** Standart dollar kursi, brak %, foyda % va standart shablonlar.

5. **🎨 Zamonaviy Telegram & iOS Dizayn Tizimi:**
   - Glassmorphism, silliq mikro-animatsiyalar, Telegram va tizim ranglariga mos Dark va Light mavzulari.
   - Telegram WebApp Haptic Feedback integratsiyasi.
   - Mobil ekranlarga (360px+) toʻliq moslashuvchanlik.

---

## 📁 Loyiha Tuzilishi

```
tannarx_webapp/
├── server.js              # Express REST API & WebApp server
├── db.js                  # SQLite (better-sqlite3) sxemasi va migratsiyalar
├── seed.js                # Exceldagi barcha xom-ashyolarni bazaga yuklovchi skript
├── bot.js                 # Telegram Bot (grammY) WebApp integratsiyasi
├── package.json           # Qaramliklar va skriptlar
├── .env                   # Muhit sozlamalari (Port, Bot Token, WebApp URL)
├── public/
│   ├── index.html         # Asosiy Telegram Mini App sahifasi
│   ├── css/
│   │   └── style.css      # Toʻliq Vanilla CSS dizayn tizimi (Dark/Light)
│   └── js/
│       ├── app.js         # Telegram SDK, mavzular va navigatsiya
│       ├── calculator.js  # Jonli hisoblash matematikasi va logikasi
│       ├── history.js     # Saqlangan hisob-kitoblar arxivi
│       ├── admin.js       # Admin panel, narxlar tarixi, Excel import/export
│       └── api.js         # Backend REST API mijozi
```

---

## 🛠️ Oʻrnatish va Ishga Tushirish

### 1. Talablar:
- Node.js (v18 yoki undan yuqori)

### 2. Kutubxonalarni oʻrnatish:
```bash
npm install
```

### 3. Boshlangʻich maʼlumotlarni bazaga yuklash:
*(3 ta Excel jadvalidagi 56 ta haqiqiy korpus, LED va blok pozitsiyalari avtomatik yuklanadi)*
```bash
npm run seed
```

### 4. Serverni ishga tushirish:
```bash
npm start
```
Brauzerda ochish: `http://localhost:3000`

---

## 🤖 Telegram Botga Ulash

1. [@BotFather](https://t.me/BotFather) dan yangi bot yarating va `TOKEN` oling.
2. `.env` faylini ochib, maʼlumotlarni kiriting:
```env
PORT=3000
BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
WEBAPP_URL=https://sizning-domen.uz
```
3. Botni ishga tushirish:
```bash
npm run bot
```

> **Eslatma (Telegram talabi):** Telegram Mini App ochilishi uchun URL `https://` (SSL/HTTPS) boʻlishi kerak. Mahalliy test qilish uchun `ngrok http 3000` yoki `localtunnel` dan foydalanishingiz mumkin.
