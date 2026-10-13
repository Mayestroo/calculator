// ==========================================================================
// CALCULATOR CONTROLLER
// Realtime LED chiroq tannarxi hisoblash moduli
// ==========================================================================

const Calculator = {
  materials: [],
  settings: {
    dollar_kursi: 12800,
    brak_percent: 3,
    profit_percent: 25,
    batch_quantity: 10,
    extra_template: []
  },

  // State
  state: {
    korpus: {
      model: '',
      color: '',
      basePrice: 0,
      customPrice: 0,
      length: 1.0,
      total: 0
    },
    led: {
      id: null,
      name: '',
      spec: '',
      unit: 'metr',
      basePrice: 0,
      customPrice: 0,
      qty: 1.0,
      total: 0
    },
    blok: {
      id: null,
      name: '',
      spec: '',
      basePrice: 0,
      customPrice: 0,
      qty: 1,
      total: 0
    },
    extras: [],
    // Calculated values
    material_usd: 0,
    brak_usd: 0,
    tannarx_usd: 0,
    tannarx_uzs: 0,
    sotish_usd: 0,
    sotish_uzs: 0,
    partiya_tannarx_usd: 0,
    partiya_tushum_usd: 0,
    partiya_foyda_usd: 0,
    partiya_foyda_uzs: 0
  },

  async init(materials, settings) {
    this.materials = materials || [];
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    // Default extras from template
    if (this.settings.extra_template && Array.isArray(this.settings.extra_template)) {
      this.state.extras = JSON.parse(JSON.stringify(this.settings.extra_template));
    } else {
      this.state.extras = [
        { id: 'ext-1', name: 'Yon qopqoqlar (zaglushka, juft)', qty: 1, price: 0.30, unit: 'juft' },
        { id: 'ext-2', name: 'Sim va vilka (1.5 metrli)', qty: 1, price: 0.45, unit: 'dona' },
        { id: 'ext-3', name: 'Qadoqlash (korobka/plyonka)', qty: 1, price: 0.35, unit: 'dona' },
        { id: 'ext-4', name: 'Yigʻish xizmati (ish haqi)', qty: 1, price: 1.20, unit: 'xizmat' },
        { id: 'ext-5', name: 'Elektr energiyasi va amortizatsiya', qty: 1, price: 0.20, unit: 'dona' }
      ];
    }

    this.renderSettingsBar();
    this.setupKorpusOptions();
    this.setupLedOptions();
    this.setupBlokOptions();
    this.renderExtraExpenses();
    this.bindEvents();
    this.calculate();
  },

  renderSettingsBar() {
    const rateEl = document.getElementById('setting-rate');
    const brakEl = document.getElementById('setting-brak');
    const profitEl = document.getElementById('setting-profit');
    const batchEl = document.getElementById('setting-batch');

    if (rateEl) rateEl.value = this.settings.dollar_kursi;
    if (brakEl) brakEl.value = this.settings.brak_percent;
    if (profitEl) profitEl.value = this.settings.profit_percent;
    if (batchEl) batchEl.value = this.settings.batch_quantity;
  },

  // 1. KORPUS SETUP
  setupKorpusOptions() {
    const modelSelect = document.getElementById('korpus-model-select');
    if (!modelSelect) return;

    const korpusList = this.materials.filter(m => m.category === 'korpus');
    // Unique model names
    const models = [...new Set(korpusList.map(m => m.name))];

    modelSelect.innerHTML = '<option value="">-- Korpus modelini tanlang --</option>' +
      models.map(m => `<option value="${m}">${m}</option>`).join('');

    // Pre-select first one if available (e.g. 50/35 PC)
    if (models.length > 0) {
      modelSelect.value = models[0];
      this.state.korpus.model = models[0];
      this.updateKorpusColors(models[0]);
    }
  },

  updateKorpusColors(modelName) {
    const chipContainer = document.getElementById('korpus-color-chips');
    if (!chipContainer) return;

    const matchingColors = this.materials.filter(m => m.category === 'korpus' && m.name === modelName);
    
    if (matchingColors.length === 0) {
      chipContainer.innerHTML = '<span class="text-muted" style="font-size:0.75rem;">Ushbu model uchun ranglar topilmadi</span>';
      return;
    }

    chipContainer.innerHTML = matchingColors.map((item, idx) => {
      let dotColor = '#94a3b8';
      const specUpper = (item.spec || '').toUpperCase();
      if (specUpper.includes('QORA')) dotColor = '#1e293b';
      else if (specUpper.includes('OQ')) dotColor = '#ffffff';
      else if (specUpper.includes('DEREVO') || specUpper.includes('OREH')) dotColor = '#b45309';
      else if (specUpper.includes('KOJA')) dotColor = '#d97706';

      const isActive = idx === 0 ? 'active' : '';
      return `
        <button type="button" class="color-chip ${isActive}" data-id="${item.id}" data-spec="${item.spec}" data-price="${item.price}">
          <span class="dot" style="background-color: ${dotColor};"></span>
          ${item.spec} ($${item.price.toFixed(2)})
        </button>
      `;
    }).join('');

    // Select first color by default
    const firstItem = matchingColors[0];
    this.state.korpus.color = firstItem.spec;
    this.state.korpus.basePrice = firstItem.price;
    this.state.korpus.customPrice = firstItem.price;

    const priceInput = document.getElementById('korpus-price-input');
    if (priceInput) priceInput.value = firstItem.price.toFixed(2);

    // Color chip click handlers
    chipContainer.querySelectorAll('.color-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        chipContainer.querySelectorAll('.color-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const price = parseFloat(chip.dataset.price);
        this.state.korpus.color = chip.dataset.spec;
        this.state.korpus.basePrice = price;
        this.state.korpus.customPrice = price;
        if (priceInput) priceInput.value = price.toFixed(2);
        this.triggerHaptic();
        this.calculate();
      });
    });
  },

  // 2. LED SETUP
  setupLedOptions() {
    const ledSelect = document.getElementById('led-type-select');
    if (!ledSelect) return;

    const ledList = this.materials.filter(m => m.category === 'led');
    ledSelect.innerHTML = '<option value="">-- LED lentani tanlang --</option>' +
      ledList.map(item => `
        <option value="${item.id}" data-price="${item.price}" data-unit="${item.unit}" data-spec="${item.spec}">
          ${item.name} (${item.spec}) — $${item.price.toFixed(2)}/${item.unit}
        </option>
      `).join('');

    if (ledList.length > 0) {
      ledSelect.value = ledList[0].id;
      this.onLedChange(ledList[0]);
    }
  },

  onLedChange(item) {
    if (!item) return;
    this.state.led.id = item.id;
    this.state.led.name = item.name;
    this.state.led.spec = item.spec;
    this.state.led.unit = item.unit || 'metr';
    this.state.led.basePrice = item.price;
    this.state.led.customPrice = item.price;

    const priceInput = document.getElementById('led-price-input');
    const unitLabel = document.getElementById('led-unit-label');
    if (priceInput) priceInput.value = item.price.toFixed(2);
    if (unitLabel) unitLabel.textContent = item.unit || 'metr';
  },

  // 3. BLOK SETUP
  setupBlokOptions() {
    const blokSelect = document.getElementById('blok-type-select');
    if (!blokSelect) return;

    const blokList = this.materials.filter(m => m.category === 'blok');
    blokSelect.innerHTML = '<option value="">-- Quvvat blokini tanlang --</option>' +
      blokList.map(item => `
        <option value="${item.id}" data-price="${item.price}" data-spec="${item.spec}">
          ${item.name} — $${item.price.toFixed(2)}
        </option>
      `).join('');

    if (blokList.length > 0) {
      blokSelect.value = blokList[0].id;
      this.onBlokChange(blokList[0]);
    }
  },

  onBlokChange(item) {
    if (!item) return;
    this.state.blok.id = item.id;
    this.state.blok.name = item.name;
    this.state.blok.spec = item.spec;
    this.state.blok.basePrice = item.price;
    this.state.blok.customPrice = item.price;

    const priceInput = document.getElementById('blok-price-input');
    const specInfo = document.getElementById('blok-spec-info');
    if (priceInput) priceInput.value = item.price.toFixed(2);
    if (specInfo) specInfo.textContent = item.spec || '';
  },

  // 4. EXTRA EXPENSES
  renderExtraExpenses() {
    const container = document.getElementById('extra-expenses-list');
    if (!container) return;

    container.innerHTML = this.state.extras.map((item, idx) => `
      <div class="extra-item" data-index="${idx}">
        <input type="text" class="extra-name" value="${item.name}" placeholder="Xarajat nomi">
        <input type="number" step="0.1" min="0" class="extra-qty" value="${item.qty}" title="Miqdor (${item.unit || 'dona'})">
        <input type="number" step="0.01" min="0" class="extra-price" value="${item.price.toFixed(2)}" title="Dona narxi ($)">
        <button type="button" class="btn-icon-danger btn-remove-extra" title="O'chirish">
          ✕
        </button>
      </div>
    `).join('');

    // Extra listeners
    container.querySelectorAll('.extra-item').forEach(itemEl => {
      const idx = parseInt(itemEl.dataset.index);

      itemEl.querySelector('.extra-name').addEventListener('input', (e) => {
        this.state.extras[idx].name = e.target.value;
      });

      itemEl.querySelector('.extra-qty').addEventListener('input', (e) => {
        this.state.extras[idx].qty = parseFloat(e.target.value) || 0;
        this.calculate();
      });

      itemEl.querySelector('.extra-price').addEventListener('input', (e) => {
        this.state.extras[idx].price = parseFloat(e.target.value) || 0;
        this.calculate();
      });

      itemEl.querySelector('.btn-remove-extra').addEventListener('click', () => {
        this.state.extras.splice(idx, 1);
        this.renderExtraExpenses();
        this.calculate();
        this.triggerHaptic();
      });
    });
  },

  addExtraExpense() {
    this.state.extras.push({
      id: 'ext-' + Date.now(),
      name: 'Yangi xarajat',
      qty: 1,
      price: 0.50,
      unit: 'dona'
    });
    this.renderExtraExpenses();
    this.calculate();
    this.triggerHaptic();
  },

  // Event bindings
  bindEvents() {
    // Korpus model change
    const modelSelect = document.getElementById('korpus-model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        this.state.korpus.model = e.target.value;
        this.updateKorpusColors(e.target.value);
        this.calculate();
      });
    }

    // Korpus length
    const lengthInput = document.getElementById('korpus-length-input');
    if (lengthInput) {
      lengthInput.addEventListener('input', (e) => {
        this.state.korpus.length = Math.max(0.01, parseFloat(e.target.value) || 0);
        this.calculate();
      });
    }

    // Korpus custom price
    const korpusPriceInput = document.getElementById('korpus-price-input');
    if (korpusPriceInput) {
      korpusPriceInput.addEventListener('input', (e) => {
        this.state.korpus.customPrice = parseFloat(e.target.value) || 0;
        this.calculate();
      });
    }

    // LED select change
    const ledSelect = document.getElementById('led-type-select');
    if (ledSelect) {
      ledSelect.addEventListener('change', (e) => {
        const item = this.materials.find(m => String(m.id) === String(e.target.value));
        if (item) {
          this.onLedChange(item);
          this.calculate();
        }
      });
    }

    // LED qty
    const ledQtyInput = document.getElementById('led-qty-input');
    if (ledQtyInput) {
      ledQtyInput.addEventListener('input', (e) => {
        this.state.led.qty = Math.max(0, parseFloat(e.target.value) || 0);
        this.calculate();
      });
    }

    // LED custom price
    const ledPriceInput = document.getElementById('led-price-input');
    if (ledPriceInput) {
      ledPriceInput.addEventListener('input', (e) => {
        this.state.led.customPrice = parseFloat(e.target.value) || 0;
        this.calculate();
      });
    }

    // Blok select change
    const blokSelect = document.getElementById('blok-type-select');
    if (blokSelect) {
      blokSelect.addEventListener('change', (e) => {
        const item = this.materials.find(m => String(m.id) === String(e.target.value));
        if (item) {
          this.onBlokChange(item);
          this.calculate();
        }
      });
    }

    // Blok qty
    const blokQtyInput = document.getElementById('blok-qty-input');
    if (blokQtyInput) {
      blokQtyInput.addEventListener('input', (e) => {
        this.state.blok.qty = Math.max(0, parseInt(e.target.value) || 0);
        this.calculate();
      });
    }

    // Blok custom price
    const blokPriceInput = document.getElementById('blok-price-input');
    if (blokPriceInput) {
      blokPriceInput.addEventListener('input', (e) => {
        this.state.blok.customPrice = parseFloat(e.target.value) || 0;
        this.calculate();
      });
    }

    // Add extra expense button
    const btnAddExtra = document.getElementById('btn-add-extra');
    if (btnAddExtra) {
      btnAddExtra.addEventListener('click', () => this.addExtraExpense());
    }

    // Settings Quick Bar inputs
    ['setting-rate', 'setting-brak', 'setting-profit', 'setting-batch'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.settings.dollar_kursi = parseFloat(document.getElementById('setting-rate').value) || 12800;
          this.settings.brak_percent = parseFloat(document.getElementById('setting-brak').value) || 0;
          this.settings.profit_percent = parseFloat(document.getElementById('setting-profit').value) || 0;
          this.settings.batch_quantity = parseInt(document.getElementById('setting-batch').value) || 1;
          this.calculate();
        });
      }
    });
  },

  // MAIN CALCULATION ENGINE
  calculate() {
    // 1. Korpus
    const korpusTotal = this.state.korpus.customPrice * this.state.korpus.length;
    this.state.korpus.total = Math.round(korpusTotal * 100) / 100;

    // 2. LED
    const ledTotal = this.state.led.customPrice * this.state.led.qty;
    this.state.led.total = Math.round(ledTotal * 100) / 100;

    // 3. Blok
    const blokTotal = this.state.blok.customPrice * this.state.blok.qty;
    this.state.blok.total = Math.round(blokTotal * 100) / 100;

    // 4. Qo'shimcha xarajatlar
    let extraTotal = 0;
    this.state.extras.forEach(item => {
      const itemSum = (item.qty || 0) * (item.price || 0);
      extraTotal += itemSum;
    });
    extraTotal = Math.round(extraTotal * 100) / 100;

    // 5. Total Material
    const material_usd = korpusTotal + ledTotal + blokTotal + extraTotal;
    this.state.material_usd = Math.round(material_usd * 100) / 100;

    // 6. Brak
    const brak_usd = this.state.material_usd * (this.settings.brak_percent / 100);
    this.state.brak_usd = Math.round(brak_usd * 100) / 100;

    // 7. Tannarx (1 dona chiroq)
    const tannarx_usd = this.state.material_usd + this.state.brak_usd;
    this.state.tannarx_usd = Math.round(tannarx_usd * 100) / 100;
    this.state.tannarx_uzs = Math.round(this.state.tannarx_usd * this.settings.dollar_kursi);

    // 8. Sotish narxi (1 dona)
    const sotish_usd = this.state.tannarx_usd * (1 + this.settings.profit_percent / 100);
    this.state.sotish_usd = Math.round(sotish_usd * 100) / 100;
    this.state.sotish_uzs = Math.round(this.state.sotish_usd * this.settings.dollar_kursi);

    // 9. Partiya uchun
    const batchQty = Math.max(1, this.settings.batch_quantity || 1);
    this.state.partiya_tannarx_usd = Math.round(this.state.tannarx_usd * batchQty * 100) / 100;
    this.state.partiya_tushum_usd = Math.round(this.state.sotish_usd * batchQty * 100) / 100;
    this.state.partiya_foyda_usd = Math.round((this.state.sotish_usd - this.state.tannarx_usd) * batchQty * 100) / 100;
    this.state.partiya_foyda_uzs = Math.round(this.state.partiya_foyda_usd * this.settings.dollar_kursi);

    this.updateResultUI(extraTotal);
  },

  updateResultUI(extraTotal) {
    // 1 dona Tannarx display
    const costUsdEl = document.getElementById('res-tannarx-usd');
    const costUzsEl = document.getElementById('res-tannarx-uzs');
    if (costUsdEl) costUsdEl.textContent = `$${this.state.tannarx_usd.toFixed(2)}`;
    if (costUzsEl) costUzsEl.textContent = `${this.formatMoney(this.state.tannarx_uzs)} soʻm`;

    // 1 dona Sotish narxi
    const sellUsdEl = document.getElementById('res-sotish-usd');
    const sellUzsEl = document.getElementById('res-sotish-uzs');
    if (sellUsdEl) sellUsdEl.textContent = `$${this.state.sotish_usd.toFixed(2)}`;
    if (sellUzsEl) sellUzsEl.textContent = `${this.formatMoney(this.state.sotish_uzs)} soʻm`;

    // Partiya hisobi
    const batchQtyEl = document.getElementById('res-batch-qty-label');
    const batchCostEl = document.getElementById('res-batch-tannarx');
    const batchRevenueEl = document.getElementById('res-batch-tushum');
    const batchProfitEl = document.getElementById('res-batch-foyda');
    const batchProfitUzsEl = document.getElementById('res-batch-foyda-uzs');

    if (batchQtyEl) batchQtyEl.textContent = `${this.settings.batch_quantity} dona`;
    if (batchCostEl) batchCostEl.textContent = `$${this.state.partiya_tannarx_usd.toFixed(2)}`;
    if (batchRevenueEl) batchRevenueEl.textContent = `$${this.state.partiya_tushum_usd.toFixed(2)}`;
    if (batchProfitEl) batchProfitEl.textContent = `$${this.state.partiya_foyda_usd.toFixed(2)}`;
    if (batchProfitUzsEl) batchProfitUzsEl.textContent = `${this.formatMoney(this.state.partiya_foyda_uzs)} soʻm`;

    // Breakdown table
    const tdKorpus = document.getElementById('bd-korpus');
    const tdLed = document.getElementById('bd-led');
    const tdBlok = document.getElementById('bd-blok');
    const tdExtra = document.getElementById('bd-extra');
    const tdBrak = document.getElementById('bd-brak');
    const tdTotal = document.getElementById('bd-total');

    if (tdKorpus) tdKorpus.textContent = `$${this.state.korpus.total.toFixed(2)}`;
    if (tdLed) tdLed.textContent = `$${this.state.led.total.toFixed(2)}`;
    if (tdBlok) tdBlok.textContent = `$${this.state.blok.total.toFixed(2)}`;
    if (tdExtra) tdExtra.textContent = `$${extraTotal.toFixed(2)}`;
    if (tdBrak) tdBrak.textContent = `$${this.state.brak_usd.toFixed(2)} (${this.settings.brak_percent}%)`;
    if (tdTotal) tdTotal.textContent = `$${this.state.tannarx_usd.toFixed(2)}`;
  },

  formatMoney(num) {
    return Number(num).toLocaleString('uz-UZ');
  },

  triggerHaptic() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  },

  generateDefaultTitle() {
    const kName = this.state.korpus.model || 'LED Chiroq';
    const kColor = this.state.korpus.color ? ` ${this.state.korpus.color}` : '';
    const kLen = this.state.korpus.length ? ` (${this.state.korpus.length}m)` : '';
    const bName = this.state.blok.name ? ` + ${this.state.blok.name.replace('BLOK PIT.', '').replace('BLOK ', '').trim()}` : '';
    return `${kName}${kColor}${kLen}${bName}`;
  },

  // Generates beautifully formatted text for Telegram share
  getTelegramShareText() {
    const title = this.generateDefaultTitle();
    const batchQty = this.settings.batch_quantity || 1;
    return (
`💡 *LED CHIROQ TANNARXI VA SOTISH HISOBI*
━━━━━━━━━━━━━━━━━━━━
📌 *Model:* ${title}

📊 *1 dona chiroq uchun:*
• Korpus (${this.state.korpus.length}m): $${this.state.korpus.total.toFixed(2)}
• LED lenta (${this.state.led.qty} ${this.state.led.unit}): $${this.state.led.total.toFixed(2)}
• Blok (${this.state.blok.qty} dona): $${this.state.blok.total.toFixed(2)}
• Qo'shimcha xarajatlar: $${(this.state.material_usd - this.state.korpus.total - this.state.led.total - this.state.blok.total).toFixed(2)}
• Texnologik brak (${this.settings.brak_percent}%): $${this.state.brak_usd.toFixed(2)}
────────────────────
💵 *Tannarx (1 dona):* $${this.state.tannarx_usd.toFixed(2)} (${this.formatMoney(this.state.tannarx_uzs)} so'm)
🏷️ *Sotish narxi (+${this.settings.profit_percent}% foyda):* $${this.state.sotish_usd.toFixed(2)} (${this.formatMoney(this.state.sotish_uzs)} so'm)

📦 *Partiya (${batchQty} dona):*
• Umumiy tannarx: $${this.state.partiya_tannarx_usd.toFixed(2)}
• Umumiy tushum: $${this.state.partiya_tushum_usd.toFixed(2)}
📈 *Kutilayotgan sof foyda:* $${this.state.partiya_foyda_usd.toFixed(2)} (${this.formatMoney(this.state.partiya_foyda_uzs)} so'm)

🗓 Sana: ${new Date().toLocaleDateString('uz-UZ')}
━━━━━━━━━━━━━━━━━━━━`
    );
  },

  // Populate from a saved calculation
  loadFromSaved(calc) {
    if (!calc) return;
    
    if (calc.settings_data) {
      this.settings = { ...this.settings, ...calc.settings_data };
      this.renderSettingsBar();
    }

    if (calc.korpus_data) {
      const kd = calc.korpus_data;
      this.state.korpus = { ...this.state.korpus, ...kd };
      const modelSelect = document.getElementById('korpus-model-select');
      if (modelSelect) modelSelect.value = kd.model;
      this.updateKorpusColors(kd.model);
      const lenInput = document.getElementById('korpus-length-input');
      if (lenInput) lenInput.value = kd.length;
      const prInput = document.getElementById('korpus-price-input');
      if (prInput) prInput.value = (kd.customPrice || kd.basePrice || 0).toFixed(2);
    }

    if (calc.led_data) {
      const ld = calc.led_data;
      this.state.led = { ...this.state.led, ...ld };
      const ledSelect = document.getElementById('led-type-select');
      if (ledSelect && ld.id) ledSelect.value = ld.id;
      const qtyInput = document.getElementById('led-qty-input');
      if (qtyInput) qtyInput.value = ld.qty;
      const prInput = document.getElementById('led-price-input');
      if (prInput) prInput.value = (ld.customPrice || ld.basePrice || 0).toFixed(2);
    }

    if (calc.blok_data) {
      const bd = calc.blok_data;
      this.state.blok = { ...this.state.blok, ...bd };
      const blokSelect = document.getElementById('blok-type-select');
      if (blokSelect && bd.id) blokSelect.value = bd.id;
      const qtyInput = document.getElementById('blok-qty-input');
      if (qtyInput) qtyInput.value = bd.qty;
      const prInput = document.getElementById('blok-price-input');
      if (prInput) prInput.value = (bd.customPrice || bd.basePrice || 0).toFixed(2);
    }

    if (calc.extra_data && Array.isArray(calc.extra_data)) {
      this.state.extras = calc.extra_data;
      this.renderExtraExpenses();
    }

    this.calculate();
  }
};
