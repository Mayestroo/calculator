// ==========================================================================
// APP MAIN CONTROLLER & TELEGRAM WEBAPP INTEGRATION
// ==========================================================================

const App = {
  currentUser: {
    id: 'demo_admin',
    first_name: 'Bosh Admin',
    role: 'admin'
  },
  currentTheme: 'dark',
  materials: [],
  settings: {},

  async init() {
    this.initTelegramWebApp();
    this.initTheme();
    await this.authenticate();
    await this.loadInitialData();
    this.bindGlobalEvents();
  },

  // Telegram WebApp Initialization
  initTelegramWebApp() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Theme sync
      if (tg.colorScheme) {
        this.setTheme(tg.colorScheme);
      }

      // Safe area padding if available
      document.body.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
    }
  },

  // Theme Management
  initTheme() {
    const saved = localStorage.getItem('tannarx_theme') || 'dark';
    this.setTheme(saved);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const next = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
      });
    }
  },

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tannarx_theme', theme);
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  // Authenticate user
  async authenticate() {
    const initData = window.Telegram?.WebApp?.initData || '';
    try {
      const res = await API.validateUser(initData, this.currentUser.id, this.currentUser.role);
      if (res.user) {
        this.currentUser = res.user;
        this.updateUserUI();
      }
    } catch (e) {
      console.warn('Auth fallback:', e);
      this.updateUserUI();
    }
  },

  updateUserUI() {
    const badge = document.getElementById('role-badge');
    const adminTabBtn = document.getElementById('nav-admin-tab');

    if (badge) {
      badge.textContent = this.currentUser.role === 'admin' ? '🛡️ Admin' : '👤 Menejer';
      badge.className = `role-badge ${this.currentUser.role}`;
    }

    // Show or hide admin tab depending on role
    if (adminTabBtn) {
      if (this.currentUser.role === 'admin') {
        adminTabBtn.style.display = 'flex';
      } else {
        adminTabBtn.style.display = 'none';
        // If current tab is admin and user is manager, switch to calc
        if (document.getElementById('tab-admin')?.classList.contains('active')) {
          this.switchTab('calc');
        }
      }
    }
  },

  // Toggle demo role for quick client testing
  toggleDemoRole() {
    const newRole = this.currentUser.role === 'admin' ? 'menejer' : 'admin';
    this.currentUser.role = newRole;
    this.currentUser.first_name = newRole === 'admin' ? 'Bosh Admin' : 'Sotuv Menejeri';
    this.updateUserUI();
    this.showToast(`Rol oʻzgartirildi: ${newRole.toUpperCase()}`, 'info');
  },

  // Load Initial Data
  async loadInitialData() {
    try {
      const [matRes, setRes] = await Promise.all([
        API.getMaterials(),
        API.getSettings()
      ]);

      this.materials = matRes.materials || [];
      this.settings = setRes.settings || {};

      // Initialize Calculator
      await Calculator.init(this.materials, this.settings);

      // Initialize Admin module
      await AdminModule.init();

      // Populate Global Settings Inputs in Settings tab
      this.populateSettingsInputs();
    } catch (e) {
      this.showToast('Maʻlumotlarni yuklashda xatolik: ' + e.message, 'error');
    }
  },

  async refreshMaterials() {
    const res = await API.getMaterials();
    this.materials = res.materials || [];
    Calculator.materials = this.materials;
    Calculator.setupKorpusOptions();
    Calculator.setupLedOptions();
    Calculator.setupBlokOptions();
    Calculator.calculate();
  },

  populateSettingsInputs() {
    const r = document.getElementById('set-default-rate');
    const b = document.getElementById('set-default-brak');
    const p = document.getElementById('set-default-profit');
    const q = document.getElementById('set-default-batch');

    if (r) r.value = this.settings.dollar_kursi || 12800;
    if (b) b.value = this.settings.brak_percent || 3;
    if (p) p.value = this.settings.profit_percent || 25;
    if (q) q.value = this.settings.batch_quantity || 10;
  },

  // Tab Navigation
  switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetNav = document.getElementById(`nav-${tabName}`);

    if (targetTab) targetTab.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    if (tabName === 'history') {
      HistoryModule.loadCalculations();
    } else if (tabName === 'admin') {
      AdminModule.loadMaterials();
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
  },

  // Global Event Bindings
  bindGlobalEvents() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Role badge click: toggles Demo role for testing
    const roleBadge = document.getElementById('role-badge');
    if (roleBadge) {
      roleBadge.addEventListener('click', () => this.toggleDemoRole());
    }

    // Save calculation button in calculator
    const btnSaveCalc = document.getElementById('btn-save-calc');
    if (btnSaveCalc) {
      btnSaveCalc.addEventListener('click', () => this.openSaveModal());
    }

    // Share button in calculator
    const btnShareCalc = document.getElementById('btn-share-calc');
    if (btnShareCalc) {
      btnShareCalc.addEventListener('click', () => {
        const text = Calculator.getTelegramShareText();
        this.openShareModal({ title: Calculator.generateDefaultTitle() }, text);
      });
    }

    // Receipt button in calculator
    const btnReceiptCalc = document.getElementById('btn-receipt-calc');
    if (btnReceiptCalc) {
      btnReceiptCalc.addEventListener('click', () => {
        this.openReceiptModal();
      });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Save calculation confirm
    const btnConfirmSave = document.getElementById('btn-confirm-save-calc');
    if (btnConfirmSave) {
      btnConfirmSave.addEventListener('click', () => this.handleConfirmSaveCalc());
    }

    // Save Material in Admin
    const btnSaveMat = document.getElementById('btn-modal-save-material');
    if (btnSaveMat) {
      btnSaveMat.addEventListener('click', () => AdminModule.handleSaveMaterial());
    }
  },

  // Save Modal
  openSaveModal() {
    const modal = document.getElementById('modal-save-calc');
    const input = document.getElementById('save-calc-title');
    if (!modal || !input) return;

    input.value = Calculator.generateDefaultTitle();
    modal.classList.add('active');
    setTimeout(() => input.focus(), 150);
  },

  async handleConfirmSaveCalc() {
    const input = document.getElementById('save-calc-title');
    const title = input ? input.value.trim() : '';

    if (!title) {
      this.showToast('Hisob nomini kiriting', 'error');
      return;
    }

    const payload = {
      title,
      telegram_id: this.currentUser.id,
      user_name: this.currentUser.first_name,
      korpus_data: Calculator.state.korpus,
      led_data: Calculator.state.led,
      blok_data: Calculator.state.blok,
      extra_data: Calculator.state.extras,
      settings_data: Calculator.settings,
      material_usd: Calculator.state.material_usd,
      brak_usd: Calculator.state.brak_usd,
      tannarx_usd: Calculator.state.tannarx_usd,
      tannarx_uzs: Calculator.state.tannarx_uzs,
      sotish_usd: Calculator.state.sotish_usd,
      sotish_uzs: Calculator.state.sotish_uzs,
      partiya_tannarx_usd: Calculator.state.partiya_tannarx_usd,
      partiya_tushum_usd: Calculator.state.partiya_tushum_usd,
      partiya_foyda_usd: Calculator.state.partiya_foyda_usd
    };

    try {
      await API.saveCalculation(payload);
      document.getElementById('modal-save-calc').classList.remove('active');
      this.showToast('Hisob-kitob muvaffaqiyatli saqlandi! 🎉', 'success');

      // If Telegram sendData is available, also notify bot
      if (window.Telegram?.WebApp?.sendData) {
        try {
          window.Telegram.WebApp.sendData(JSON.stringify(payload));
        } catch (e) {}
      }
    } catch (err) {
      this.showToast('Saqlashda xatolik: ' + err.message, 'error');
    }
  },

  // Share Modal
  openShareModal(calcObj, customText) {
    const modal = document.getElementById('modal-share');
    const textarea = document.getElementById('share-text-content');
    if (!modal || !textarea) return;

    const text = customText || (calcObj ? this.formatCalcShareText(calcObj) : Calculator.getTelegramShareText());
    textarea.value = text;
    modal.classList.add('active');

    // Copy button
    const btnCopy = document.getElementById('btn-copy-share');
    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(text);
        this.showToast('Matn nusxalandi! 📋', 'success');
      };
    }

    // Direct Telegram share button
    const btnTgShare = document.getElementById('btn-tg-direct-share');
    if (btnTgShare) {
      btnTgShare.onclick = () => {
        const encoded = encodeURIComponent(text);
        window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
      };
    }
  },

  formatCalcShareText(calc) {
    return (
`💡 *LED CHIROQ TANNARXI VA SOTISH HISOBI*
━━━━━━━━━━━━━━━━━━━━
📌 *Model:* ${calc.title}
💵 *Tannarx (1 dona):* $${calc.tannarx_usd.toFixed(2)} (${Number(calc.tannarx_uzs).toLocaleString()} so'm)
🏷️ *Sotish narxi:* $${calc.sotish_usd.toFixed(2)} (${Number(calc.sotish_uzs).toLocaleString()} so'm)
📦 *Partiya tannarxi:* $${calc.partiya_tannarx_usd.toFixed(2)}
📈 *Kutilayotgan sof foyda:* $${calc.partiya_foyda_usd.toFixed(2)}
🗓 *Sana:* ${new Date(calc.created_at || Date.now()).toLocaleDateString('uz-UZ')}
━━━━━━━━━━━━━━━━━━━━`
    );
  },

  // Receipt / Kvitansiya Modal
  openReceiptModal(calcObj) {
    const modal = document.getElementById('modal-receipt');
    const bodyEl = document.getElementById('receipt-content-body');
    if (!modal || !bodyEl) return;

    const data = calcObj || {
      title: Calculator.generateDefaultTitle(),
      created_at: new Date().toISOString(),
      korpus_data: Calculator.state.korpus,
      led_data: Calculator.state.led,
      blok_data: Calculator.state.blok,
      extra_data: Calculator.state.extras,
      settings_data: Calculator.settings,
      material_usd: Calculator.state.material_usd,
      brak_usd: Calculator.state.brak_usd,
      tannarx_usd: Calculator.state.tannarx_usd,
      tannarx_uzs: Calculator.state.tannarx_uzs,
      sotish_usd: Calculator.state.sotish_usd,
      sotish_uzs: Calculator.state.sotish_uzs,
      partiya_tannarx_usd: Calculator.state.partiya_tannarx_usd,
      partiya_tushum_usd: Calculator.state.partiya_tushum_usd,
      partiya_foyda_usd: Calculator.state.partiya_foyda_usd
    };

    const extrasHtml = (data.extra_data || []).map(e => `
      <div class="receipt-line">
        <span>- ${e.name} (${e.qty} ${e.unit || 'dona'})</span>
        <span>$${((e.qty || 1) * (e.price || 0)).toFixed(2)}</span>
      </div>
    `).join('');

    bodyEl.innerHTML = `
      <div class="receipt-box">
        <div class="receipt-header">
          <h3>LED CHIROQ HISOB-VARAGʻI</h3>
          <p style="font-size: 0.72rem; color: #64748b;">Kalkulyatsiya va Tannarx Cheki</p>
          <p style="font-size: 0.72rem;">${new Date(data.created_at).toLocaleString('uz-UZ')}</p>
        </div>

        <div style="margin-bottom: 10px;">
          <strong>Model:</strong> ${data.title}
        </div>

        <div class="receipt-line">
          <span>Korpus (${data.korpus_data?.model || ''} - ${data.korpus_data?.color || ''}, ${data.korpus_data?.length}m)</span>
          <span>$${(data.korpus_data?.total || 0).toFixed(2)}</span>
        </div>
        <div class="receipt-line">
          <span>LED (${data.led_data?.name?.substring(0, 22) || 'LED'}..., ${data.led_data?.qty}m)</span>
          <span>$${(data.led_data?.total || 0).toFixed(2)}</span>
        </div>
        <div class="receipt-line">
          <span>Blok (${data.blok_data?.name?.substring(0, 22) || 'Blok'}..., ${data.blok_data?.qty}dona)</span>
          <span>$${(data.blok_data?.total || 0).toFixed(2)}</span>
        </div>

        <div style="margin: 6px 0 2px 0; font-size: 0.76rem; color: #64748b; font-weight: bold;">Qo'shimcha sarf-xarajatlar:</div>
        ${extrasHtml}

        <div class="receipt-line" style="margin-top: 6px;">
          <span>Brak foizi (${data.settings_data?.brak_percent || 3}%)</span>
          <span>$${data.brak_usd.toFixed(2)}</span>
        </div>

        <div class="receipt-line receipt-total" style="font-size: 0.95rem;">
          <span>1 DONA TANNARX:</span>
          <span>$${data.tannarx_usd.toFixed(2)}</span>
        </div>
        <div class="receipt-line" style="font-size: 0.8rem; color: #475569;">
          <span>So'mdagi tannarx:</span>
          <span>${Number(data.tannarx_uzs).toLocaleString()} so'm</span>
        </div>

        <div class="receipt-line" style="margin-top: 8px; font-weight: bold; color: #0284c7;">
          <span>TAVSIYA ETILGAN SOTISH NARXI:</span>
          <span>$${data.sotish_usd.toFixed(2)}</span>
        </div>
        <div class="receipt-line" style="font-size: 0.8rem; color: #0284c7;">
          <span>So'mda (+${data.settings_data?.profit_percent || 25}% foyda):</span>
          <span>${Number(data.sotish_uzs).toLocaleString()} so'm</span>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; margin-top: 10px; padding-top: 8px; font-size: 0.78rem;">
          <div class="receipt-line">
            <span>Partiya soni:</span>
            <span>${data.settings_data?.batch_quantity || 10} dona</span>
          </div>
          <div class="receipt-line">
            <span>Partiya tannarxi:</span>
            <span>$${data.partiya_tannarx_usd.toFixed(2)}</span>
          </div>
          <div class="receipt-line">
            <span>Partiya umumiy tushumi:</span>
            <span>$${data.partiya_tushum_usd.toFixed(2)}</span>
          </div>
          <div class="receipt-line" style="font-weight: bold; color: #16a34a;">
            <span>Kutilayotgan sof foyda:</span>
            <span>+$${data.partiya_foyda_usd.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    // Print button
    const btnPrint = document.getElementById('btn-print-receipt');
    if (btnPrint) {
      btnPrint.onclick = () => window.print();
    }
  },

  // Toast Notification
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

// Auto start when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
