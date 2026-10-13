// ==========================================================================
// HISTORY & SAVED CALCULATIONS MODULE
// ==========================================================================

const HistoryModule = {
  calculations: [],

  async loadCalculations() {
    const listContainer = document.getElementById('saved-calculations-list');
    if (!listContainer) return;

    try {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted);">
          Yuklanmoqda...
        </div>
      `;

      const res = await API.getCalculations();
      this.calculations = res.calculations || [];
      this.render();
    } catch (err) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: #fb7185;">
          Hisoblarni yuklashda xatolik: ${err.message}
        </div>
      `;
    }
  },

  render() {
    const listContainer = document.getElementById('saved-calculations-list');
    if (!listContainer) return;

    if (this.calculations.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
          <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Saqlangan hisoblar mavjud emas</div>
          <div style="font-size: 0.8rem;">Hisoblash ekraniga o'ting va "Saqlash" tugmasini bosing.</div>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.calculations.map(item => {
      const dateStr = new Date(item.created_at).toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="saved-item" data-id="${item.id}">
          <div class="saved-header">
            <div>
              <div class="saved-title">${item.title}</div>
              <div class="saved-date">📅 ${dateStr} • ${item.user_name || 'Menejer'}</div>
            </div>
            <span class="role-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: none;">
              $${item.tannarx_usd.toFixed(2)}
            </span>
          </div>

          <div class="saved-kpi-row">
            <div>Tannarx: <span class="val">$${item.tannarx_usd.toFixed(2)}</span> (${Number(item.tannarx_uzs).toLocaleString()} soʻm)</div>
            <div>Sotish: <span class="val" style="color: #34d399;">$${item.sotish_usd.toFixed(2)}</span></div>
          </div>

          <div class="saved-actions">
            <button class="btn btn-secondary btn-sm btn-open-calc" data-id="${item.id}">
              ✏️ Ochish
            </button>
            <button class="btn btn-secondary btn-sm btn-receipt-calc" data-id="${item.id}">
              🧾 Chek
            </button>
            <button class="btn btn-secondary btn-sm btn-share-calc" data-id="${item.id}">
              📤 Ulashish
            </button>
            <button class="btn btn-icon-danger btn-delete-calc" data-id="${item.id}" title="O'chirish" style="width: 28px; height: 28px; font-size: 11px;">
              🗑
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.bindEvents();
  },

  bindEvents() {
    const listContainer = document.getElementById('saved-calculations-list');
    if (!listContainer) return;

    // Open & Load into Calculator
    listContainer.querySelectorAll('.btn-open-calc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await API.getCalculationById(id);
          Calculator.loadFromSaved(res.calculation);
          // Switch to calc tab
          App.switchTab('calc');
          App.showToast('Hisob-kitob kalkulyatorga yuklandi', 'success');
        } catch (e) {
          App.showToast('Yuklashda xatolik: ' + e.message, 'error');
        }
      });
    });

    // Share calculation
    listContainer.querySelectorAll('.btn-share-calc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await API.getCalculationById(id);
          App.openShareModal(res.calculation);
        } catch (e) {
          App.showToast('Xatolik: ' + e.message, 'error');
        }
      });
    });

    // Receipt / Print
    listContainer.querySelectorAll('.btn-receipt-calc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await API.getCalculationById(id);
          App.openReceiptModal(res.calculation);
        } catch (e) {
          App.showToast('Xatolik: ' + e.message, 'error');
        }
      });
    });

    // Delete calculation
    listContainer.querySelectorAll('.btn-delete-calc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Ushbu hisob-kitobni oʻchirishni tasdiqlaysizmi?')) {
          try {
            await API.deleteCalculation(id);
            this.calculations = this.calculations.filter(c => String(c.id) !== String(id));
            this.render();
            App.showToast('Hisob-kitob oʻchirildi', 'success');
          } catch (e) {
            App.showToast('Oʻchirishda xatolik: ' + e.message, 'error');
          }
        }
      });
    });
  }
};
