const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const xlsx = require('xlsx');
const { db, initDatabase, isPostgres } = require('./db');
const { runSeed } = require('./seed');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for Excel file upload
const upload = multer({ dest: path.join(__dirname, 'uploads/') });
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// ==========================================
// 1. TELEGRAM AUTH & USER VERIFICATION
// ==========================================

function verifyTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    const params = [];
    for (const [key, value] of urlParams.entries()) {
      params.push(`${key}=${value}`);
    }
    params.sort();
    const dataCheckString = params.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userJson = urlParams.get('user');
      return userJson ? JSON.parse(userJson) : {};
    }
    return null;
  } catch (err) {
    console.error('Telegram validation error:', err);
    return null;
  }
}

app.post('/api/auth/validate', async (req, res) => {
  const { initData, demoUserId, demoRole } = req.body;

  let tgUser = null;
  if (initData && BOT_TOKEN) {
    tgUser = verifyTelegramWebAppData(initData, BOT_TOKEN);
  }

  // Fallback demo user for local browser dev & testing
  if (!tgUser) {
    const userId = demoUserId || 'demo_admin';
    const role = demoRole || 'admin';
    return res.json({
      success: true,
      isDemo: true,
      user: {
        id: userId,
        first_name: role === 'admin' ? 'Bosh Admin' : 'Sotuv Menejeri',
        username: role === 'admin' ? 'admin_tannarx' : 'menejer_user',
        role: role
      }
    });
  }

  try {
    // Check user in database
    const userRecord = await db.get('SELECT * FROM users WHERE telegram_id = ?', [String(tgUser.id)]);
    
    // Check admin settings
    const adminIdsSetting = await db.get('SELECT value FROM settings WHERE key = ?', ['admin_ids']);
    let adminIds = [];
    try {
      adminIds = adminIdsSetting ? JSON.parse(adminIdsSetting.value) : [];
    } catch (e) {
      adminIds = [];
    }

    let role = 'menejer';
    if (adminIds.includes(String(tgUser.id)) || (userRecord && userRecord.role === 'admin')) {
      role = 'admin';
    }

    // Register or update user
    const isAllowed = userRecord ? userRecord.is_allowed : 1;
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

    if (isPostgres) {
      await db.run(`
        INSERT INTO users (telegram_id, name, username, role, is_allowed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (telegram_id) DO UPDATE SET
          name = EXCLUDED.name,
          username = EXCLUDED.username
      `, [String(tgUser.id), fullName, tgUser.username || '', role, isAllowed]);
    } else {
      await db.run(`
        INSERT INTO users (telegram_id, name, username, role, is_allowed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          name = excluded.name,
          username = excluded.username
      `, [String(tgUser.id), fullName, tgUser.username || '', role, isAllowed]);
    }

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: 'Sizga ushbu ilovadan foydalanish uchun ruxsat berilmagan. Iltimos korxona administratori bilan bogʻlaning.'
      });
    }

    res.json({
      success: true,
      isDemo: false,
      user: {
        id: String(tgUser.id),
        first_name: fullName,
        username: tgUser.username,
        role: role
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. MATERIALS APIS
// ==========================================

app.get('/api/materials', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM materials WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR spec LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category ASC, name ASC, price ASC';
    const items = await db.all(query, params);
    res.json({ success: true, materials: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { category, name, spec, unit, price, changed_by } = req.body;
    if (!category || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Barcha majburiy maydonlarni toʻldiring' });
    }

    const result = await db.run(`
      INSERT INTO materials (category, name, spec, unit, price)
      VALUES (?, ?, ?, ?, ?)
    `, [category, name.trim(), (spec || '').trim(), unit || 'metr', parseFloat(price)]);

    const newId = result.lastInsertRowid;

    // Log in price history
    if (newId) {
      await db.run(`
        INSERT INTO price_history (material_id, material_name, spec, old_price, new_price, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [newId, name.trim(), (spec || '').trim(), 0, parseFloat(price), changed_by || 'Admin']);
    }

    res.json({ success: true, id: newId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, spec, unit, price, changed_by } = req.body;

    const current = await db.get('SELECT * FROM materials WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Xom-ashyo topilmadi' });
    }

    const newPrice = parseFloat(price);
    const oldPrice = current.price;

    await db.run(`
      UPDATE materials
      SET category = ?, name = ?, spec = ?, unit = ?, price = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      category || current.category,
      name ? name.trim() : current.name,
      spec !== undefined ? spec.trim() : current.spec,
      unit || current.unit,
      newPrice,
      id
    ]);

    // If price changed, record in history
    if (Math.abs(oldPrice - newPrice) > 0.0001) {
      await db.run(`
        INSERT INTO price_history (material_id, material_name, spec, old_price, new_price, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, name || current.name, spec !== undefined ? spec : current.spec, oldPrice, newPrice, changed_by || 'Admin']);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Price History
app.get('/api/price-history', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const history = await db.all(`
      SELECT * FROM price_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [parseInt(limit)]);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. SETTINGS APIS
// ==========================================

app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM settings');
    const settingsObj = {};
    for (const row of rows) {
      try {
        settingsObj[row.key] = JSON.parse(row.value);
      } catch {
        settingsObj[row.key] = row.value;
      }
    }
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, val] of Object.entries(updates)) {
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (isPostgres) {
        await db.run(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [key, valStr]
        );
      } else {
        await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, valStr]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. CALCULATIONS APIS (Saqlash va hisoblar)
// ==========================================

app.get('/api/calculations', async (req, res) => {
  try {
    const { telegram_id } = req.query;
    let query = 'SELECT id, title, telegram_id, user_name, material_usd, brak_usd, tannarx_usd, tannarx_uzs, sotish_usd, sotish_uzs, partiya_tannarx_usd, partiya_tushum_usd, partiya_foyda_usd, created_at FROM calculations';
    const params = [];

    if (telegram_id) {
      query += ' WHERE telegram_id = ?';
      params.push(telegram_id);
    }

    query += ' ORDER BY created_at DESC';
    const list = await db.all(query, params);
    res.json({ success: true, calculations: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/calculations/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM calculations WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Hisob-kitob topilmadi' });
    }

    // Parse JSON fields
    try {
      item.korpus_data = typeof item.korpus_data === 'string' ? JSON.parse(item.korpus_data) : item.korpus_data;
      item.led_data = typeof item.led_data === 'string' ? JSON.parse(item.led_data) : item.led_data;
      item.blok_data = typeof item.blok_data === 'string' ? JSON.parse(item.blok_data) : item.blok_data;
      item.extra_data = typeof item.extra_data === 'string' ? JSON.parse(item.extra_data) : item.extra_data;
      item.settings_data = typeof item.settings_data === 'string' ? JSON.parse(item.settings_data) : item.settings_data;
    } catch (e) {
      console.error('JSON parse error in calculations:', e);
    }

    res.json({ success: true, calculation: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/calculations', async (req, res) => {
  try {
    const {
      title,
      telegram_id,
      user_name,
      korpus_data,
      led_data,
      blok_data,
      extra_data,
      settings_data,
      material_usd,
      brak_usd,
      tannarx_usd,
      tannarx_uzs,
      sotish_usd,
      sotish_uzs,
      partiya_tannarx_usd,
      partiya_tushum_usd,
      partiya_foyda_usd
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Hisob nomini kiriting' });
    }

    const result = await db.run(`
      INSERT INTO calculations (
        title, telegram_id, user_name,
        korpus_data, led_data, blok_data, extra_data, settings_data,
        material_usd, brak_usd, tannarx_usd, tannarx_uzs,
        sotish_usd, sotish_uzs, partiya_tannarx_usd, partiya_tushum_usd, partiya_foyda_usd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      telegram_id || '',
      user_name || 'Foydalanuvchi',
      JSON.stringify(korpus_data || {}),
      JSON.stringify(led_data || {}),
      JSON.stringify(blok_data || {}),
      JSON.stringify(extra_data || []),
      JSON.stringify(settings_data || {}),
      material_usd || 0,
      brak_usd || 0,
      tannarx_usd || 0,
      tannarx_uzs || 0,
      sotish_usd || 0,
      sotish_uzs || 0,
      partiya_tannarx_usd || 0,
      partiya_tushum_usd || 0,
      partiya_foyda_usd || 0
    ]);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/calculations/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM calculations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. EXCEL IMPORT & EXPORT
// ==========================================

app.post('/api/materials/import-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Excel fayl yuklanmadi' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    let importedCount = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      if (!data || data.length < 2) continue;

      let cat = 'korpus';
      const lowerSheet = sheetName.toLowerCase();
      if (lowerSheet.includes('led')) cat = 'led';
      else if (lowerSheet.includes('blok') || lowerSheet.includes('drayver')) cat = 'blok';
      else if (lowerSheet.includes('korpus') || lowerSheet.includes('pvc') || lowerSheet.includes('profil')) cat = 'korpus';

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        let name = String(row[0] || '').trim();
        if (!name) continue;

        let spec = String(row[1] || '').trim();
        let unit = String(row[2] || (cat === 'blok' ? 'dona' : 'metr')).trim();
        let price = parseFloat(row[3]);

        if (isNaN(price)) {
          for (let c = row.length - 1; c >= 1; c--) {
            const val = parseFloat(row[c]);
            if (!isNaN(val) && val > 0 && val < 500) {
              price = val;
              break;
            }
          }
        }

        if (!isNaN(price) && price > 0) {
          await db.run(
            'INSERT INTO materials (category, name, spec, unit, price) VALUES (?, ?, ?, ?, ?)',
            [cat, name, spec, unit, price]
          );
          importedCount++;
        }
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: importedCount, message: `${importedCount} ta xom-ashyo muvaffaqiyatli import qilindi` });
  } catch (err) {
    console.error('Import error:', err);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: 'Excel faylni oʻqishda xatolik yuz berdi: ' + err.message });
  }
});

app.get('/api/materials/export-excel', async (req, res) => {
  try {
    const wb = xlsx.utils.book_new();

    const korpusItems = await db.all('SELECT name as "Tovar Nomi", spec as "Rangi", unit as "Birlik", price as "1 Metr Tan Narxi ($)" FROM materials WHERE category = \'korpus\'');
    const ledItems = await db.all('SELECT name as "Tovar Nomi", spec as "Texnik Xususiyati", unit as "Birlik", price as "Tan Narxi ($)" FROM materials WHERE category = \'led\'');
    const blokItems = await db.all('SELECT name as "Tovar Nomi", spec as "Texnik Xususiyati", unit as "Birlik", price as "1 Dona Tan Narxi ($)" FROM materials WHERE category = \'blok\'');

    const wsKorpus = xlsx.utils.json_to_sheet(korpusItems);
    const wsLed = xlsx.utils.json_to_sheet(ledItems);
    const wsBlok = xlsx.utils.json_to_sheet(blokItems);

    xlsx.utils.book_append_sheet(wb, wsKorpus, 'KORPUS');
    xlsx.utils.book_append_sheet(wb, wsLed, 'LED');
    xlsx.utils.book_append_sheet(wb, wsBlok, 'BLOK');

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="led_chiroq_xom_ashyo_narxlari.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Eksportda xatolik: ' + err.message });
  }
});

// ==========================================
// 6. USERS MANAGEMENT APIS
// ==========================================

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { telegram_id, name, username, role, is_allowed } = req.body;
  if (!telegram_id) {
    return res.status(400).json({ success: false, error: 'Telegram ID kiritilishi shart' });
  }

  try {
    if (isPostgres) {
      await db.run(`
        INSERT INTO users (telegram_id, name, username, role, is_allowed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (telegram_id) DO UPDATE SET
          name = EXCLUDED.name,
          username = EXCLUDED.username,
          role = EXCLUDED.role,
          is_allowed = EXCLUDED.is_allowed
      `, [
        String(telegram_id).trim(),
        (name || '').trim(),
        (username || '').trim(),
        role || 'menejer',
        is_allowed === undefined ? 1 : (is_allowed ? 1 : 0)
      ]);
    } else {
      await db.run(`
        INSERT INTO users (telegram_id, name, username, role, is_allowed)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          name = excluded.name,
          username = excluded.username,
          role = excluded.role,
          is_allowed = excluded.is_allowed
      `, [
        String(telegram_id).trim(),
        (name || '').trim(),
        (username || '').trim(),
        role || 'menejer',
        is_allowed === undefined ? 1 : (is_allowed ? 1 : 0)
      ]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:telegram_id', async (req, res) => {
  try {
    await db.run('DELETE FROM users WHERE telegram_id = ?', [String(req.params.telegram_id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// START SERVER FUNCTION
// ==========================================

async function startServer() {
  try {
    await initDatabase();
    await runSeed();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 LED Tannarx Telegram Mini App server running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🗄️ Baza turi: ${isPostgres ? 'PostgreSQL (Neon.tech)' : 'SQLite'}`);
      console.log(`===============================================`);

      if (BOT_TOKEN) {
        try {
          const { startBot } = require('./bot');
          startBot();
        } catch (botErr) {
          console.error('Telegram bot ishga tushirishda xatolik:', botErr.message);
        }
      }
    });
  } catch (err) {
    console.error('Serverni ishga tushirishda xatolik:', err);
    process.exit(1);
  }
}

startServer();
