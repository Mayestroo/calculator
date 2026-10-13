const { db, initDatabase } = require('./db');

function runSeed() {
  initDatabase();

  const count = db.prepare('SELECT COUNT(*) as cnt FROM materials').get().cnt;
  if (count > 0) {
    console.log(`Database already contains ${count} materials. Skipping seed.`);
    return;
  }

  console.log('Seeding initial materials and settings from Excel tables...');

  const insertMaterial = db.prepare(`
    INSERT INTO materials (category, name, spec, unit, price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const materialsData = [
    // 1. KORPUS (PVC profillar va ranglari)
    { category: 'korpus', name: '50/35 PC', spec: 'QORA MATT', unit: 'metr', price: 1.70 },
    { category: 'korpus', name: '60/35 PC', spec: 'QORA MATT', unit: 'metr', price: 1.80 },
    { category: 'korpus', name: '100/35 PC', spec: 'QORA MATT', unit: 'metr', price: 2.30 },
    { category: 'korpus', name: '100/35 PC', spec: 'OQ MATT', unit: 'metr', price: 2.30 },
    { category: 'korpus', name: '100/35 PC', spec: 'DEREVO OREH', unit: 'metr', price: 2.50 },
    { category: 'korpus', name: '35/70 PC', spec: 'QORA MATT', unit: 'metr', price: 3.10 },
    { category: 'korpus', name: '35/70 PC', spec: 'OQ MATT', unit: 'metr', price: 3.10 },
    { category: 'korpus', name: '35/70 PC', spec: 'DEREVO OREH', unit: 'metr', price: 3.60 },
    { category: 'korpus', name: '50/75 PC', spec: 'QORA MATT', unit: 'metr', price: 2.60 },
    { category: 'korpus', name: '50/75 PC', spec: 'OQ MATT', unit: 'metr', price: 2.60 },
    { category: 'korpus', name: '50/75 PC', spec: 'DEREVO OREH', unit: 'metr', price: 2.80 },
    { category: 'korpus', name: '100/75 PC', spec: 'QORA MATT', unit: 'metr', price: 4.00 },
    { category: 'korpus', name: '100/75 PC', spec: 'OQ MATT', unit: 'metr', price: 4.00 },
    { category: 'korpus', name: '100/75 PC', spec: 'DEREVO OREH', unit: 'metr', price: 4.20 },
    { category: 'korpus', name: '100/75 PC', spec: 'TEKSTURA KOJA', unit: 'metr', price: 5.70 },
    { category: 'korpus', name: '70/35 PC', spec: 'QORA MATT', unit: 'metr', price: 1.90 },
    { category: 'korpus', name: '70/35 PC', spec: 'OQ MATT', unit: 'metr', price: 1.90 },
    { category: 'korpus', name: '70/35 PC', spec: 'DEREVO OREH', unit: 'metr', price: 2.10 },
    { category: 'korpus', name: '80/35 PC', spec: 'QORA MATT', unit: 'metr', price: 2.00 },
    { category: 'korpus', name: '80/35 PC', spec: 'OQ MATT', unit: 'metr', price: 2.00 },
    { category: 'korpus', name: '80/35 PC', spec: 'DEREVO OREH', unit: 'metr', price: 2.20 },
    { category: 'korpus', name: '50/80 PC', spec: 'QORA MATT', unit: 'metr', price: 4.40 },
    { category: 'korpus', name: '50/80 PC', spec: 'DEREVO OREH', unit: 'metr', price: 4.70 },
    { category: 'korpus', name: '5080 DUMALOQ KORPUS', spec: 'QORA MATT', unit: 'metr', price: 1.60 },
    { category: 'korpus', name: '5080 DUMALOQ KORPUS', spec: 'OQ MATT', unit: 'metr', price: 1.60 },

    // 2. LED (Lentalar va modullar)
    { category: 'led', name: 'LED LENTA-2835-240D-10MM 12V-OQ YORUGLIK - IP20(10METR QADOQ)', spec: '6500K 12V Oq', unit: 'metr', price: 0.44 },
    { category: 'led', name: 'LED LENTA-2835-240D-10MM 12V-NEYTRAL YORIGLIK - IP20(10METR QADOQ)', spec: '4000K 12V Neytral', unit: 'metr', price: 0.44 },
    { category: 'led', name: 'COB LED LENTA-480D-8MM-12V-OQ YORUGLIK-IP20(10METR QADOQ)', spec: '6500K 12V COB Oq', unit: 'metr', price: 0.67 },
    { category: 'led', name: 'COB LED LENTA-480D-8MM-12V-NEYTRAL YORIGLIK-IP20(10METR QADOQ)', spec: '4000K 12V COB Neytral', unit: 'metr', price: 0.67 },
    { category: 'led', name: 'LUPALI DONA188C-488X10MM-9V-OQ YORIGLIK', spec: '6500K 9V Lupali dona', unit: 'dona', price: 0.15 },
    { category: 'led', name: 'LUPALI RULON 24V', spec: '6500K 48 ta LED 11mm', unit: 'metr', price: 0.52 },
    { category: 'led', name: '1M/240 LED LENTA', spec: '6500K 12V-2835-240 Boncukfar', unit: 'metr', price: 0.44 },
    { category: 'led', name: '1M/240 LED LENTA', spec: '4000K 12V-2835-240 Boncukfar', unit: 'metr', price: 0.44 },
    { category: 'led', name: 'BESHTALI LED DIFFUZORGA', spec: '6500K 220V-2835-320 Simli besh', unit: 'metr', price: 0.68 },
    { category: 'led', name: 'BUKILADIGAN LED', spec: '6500K 12V-2835-120 Boncukfar', unit: 'metr', price: 0.76 },
    { category: 'led', name: 'BUKILADIGAN LED', spec: '4000K 12V-2835-120 Boncukfar', unit: 'metr', price: 0.76 },
    { category: 'led', name: 'COB LED LENTA', spec: '6500K COB 12V-480 Pearl-8mm', unit: 'metr', price: 0.66 },
    { category: 'led', name: 'BESHTALI LED 220V-2835-12MM', spec: '6500K 220V Beshtali', unit: 'metr', price: 0.59 },
    { category: 'led', name: '24V 3535 LUPALI LED', spec: '6500K 24V Lupali', unit: 'metr', price: 0.47 },

    // 3. BLOK (Quvvat bloklari / drayverlar)
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-60W [TR]', spec: 'TR-60W-12VAC110V-265V-12Ф*26', unit: 'dona', price: 2.09 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-80W [TR]', spec: 'TR-100W-12VAC110V-265V-13Ф*48', unit: 'dona', price: 2.67 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-200W [TR]', spec: 'TR-200W-12VAC175V-265V-17Ф*48', unit: 'dona', price: 3.69 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-300W [TR]', spec: 'TR-300W-12VAC175V-265V-22Ф*58', unit: 'dona', price: 4.68 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-400W [TR]', spec: 'TR-400W-12VAC175V-265V-22Ф*58', unit: 'dona', price: 5.32 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-100W [TR]', spec: 'TR-100-24VAC110V-265V-13Ф*48', unit: 'dona', price: 2.67 },
    { category: 'blok', name: 'BLOK PIT.KOTTA KORPUS-200W [TR]', spec: 'TR-200-W024VAC175V-265V-17Ф*4', unit: 'dona', price: 3.69 },
    { category: 'blok', name: 'BLOK PIT.KICHKINA KORPUS-60W [TR]', spec: 'T-60W-12VAC110V-265-V-18*2.5*2.', unit: 'dona', price: 2.68 },
    { category: 'blok', name: 'BLOK PIT.KICHKINA KORPUS-100W [TR]', spec: 'T-100W-12VAC110V-265V-22*2.5*2.', unit: 'dona', price: 3.50 },
    { category: 'blok', name: 'BLOK PIT.KICHKINA KORPUS-200W [TR]', spec: 'T-200W-12VAC110V-265V-27Ф*2.5*', unit: 'dona', price: 4.83 },
    { category: 'blok', name: 'BLOK ALUMIN KOR.PALOCHKA-12W [TC]', spec: 'TC-12W-12VAC175-265V-14*20*20', unit: 'dona', price: 0.77 },
    { category: 'blok', name: 'BLOK ALUMIN KOR.PALOCHKA-24W [TC]', spec: 'TC-24W-12VAC175-265V-1.8Ф*17*1', unit: 'dona', price: 0.92 },
    { category: 'blok', name: 'BLOK ALUMIN KOR.PALOCHKA-36W [TC]', spec: 'TC-36W-12VAC175-265V-2.23Ф*17*', unit: 'dona', price: 1.29 },
    { category: 'blok', name: 'BLOK ALUMIN KOR.PALOCHKA-60W [TC]', spec: 'TC-72W-13VAC175-265V-3.32Ф*17*', unit: 'dona', price: 1.65 },
    { category: 'blok', name: 'BLOK ALIMIN KOR.PALOCHKA-72W [TC]', spec: 'TC-72W-13VAC175-265V-3.32Ф*17*', unit: 'dona', price: 1.87 },
    { category: 'blok', name: 'PRILLAMIDIGAN BLOK', spec: '220V 250W PIRILLAMIDIGAN BLOK', unit: 'dona', price: 2.61 },
    { category: 'blok', name: '250 VT SIMSIZ, MILTILLAMAYDI, SIM BILAN ULANG', spec: '250W Simsiz / Miltillamaydi', unit: 'dona', price: 3.42 }
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertMaterial.run(item.category, item.name, item.spec, item.unit, item.price);
    }
  });

  insertMany(materialsData);

  // Settings
  const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);

  insertSetting.run('dollar_kursi', '12800');
  insertSetting.run('brak_percent', '3');
  insertSetting.run('profit_percent', '25');
  insertSetting.run('batch_quantity', '10');
  insertSetting.run('admin_ids', JSON.stringify(['admin', 'demo_admin', '54321']));
  insertSetting.run('extra_template', JSON.stringify([
    { id: 'ext-1', name: 'Yon qopqoqlar (zaglushka, juft)', qty: 1, price: 0.30, unit: 'juft' },
    { id: 'ext-2', name: 'Sim va vilka (1.5 metrli)', qty: 1, price: 0.45, unit: 'dona' },
    { id: 'ext-3', name: 'Qadoqlash (korobka va plyonka)', qty: 1, price: 0.35, unit: 'dona' },
    { id: 'ext-4', name: 'Yigʻish xizmati (ish haqi)', qty: 1, price: 1.20, unit: 'xizmat' },
    { id: 'ext-5', name: 'Elektr energiyasi va amortizatsiya', qty: 1, price: 0.20, unit: 'dona' }
  ]));

  // Default Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (telegram_id, name, username, role, is_allowed)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('demo_admin', 'Bosh Admin (Egasi)', 'tannarx_admin', 'admin', 1);
  insertUser.run('demo_manager', 'Sotuv Menejeri', 'menejer_user', 'menejer', 1);

  console.log(`Seeding finished successfully! Added ${materialsData.length} raw material records.`);
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
