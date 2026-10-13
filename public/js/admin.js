// ==========================================================================
// ADMIN PANEL MODULE
// ==========================================================================

const AdminModule = {
  currentCategory: 'all',
  searchQuery: '',
  materials: [],
  priceHistory: [],
  users: [],

  async init() {
    await this.loadMaterials();
    await this.loadPriceHistory();
    await this.loadUsers();
    this.bindEvents();
  },

  async loadMaterials() {
    try {
      const res = await API.getMaterials();
      this.materials = res.materials || [];
      this.renderMaterialsTable();
      this.updateStats();
    } catch (e) {
      console.error('Failed to load admin materials:', e);
    }
  },

  async loadPriceHistory() {
    try {
      const res = await API.getPriceHistory(50);
      this.priceHistory = res.history || [];
      this.renderHistoryTable();
    } catch (e) {
      console.error('Failed to load price history:', e);
    }
  },

  async loadUsers() {
    try {
      const res = await API.getUsers();
      this.users = res.users || [];
      this.renderUsersList();
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  },

  updateStats() {
    const kCount = this.materials.filter(m => m.category === 'korpus').length;
    const lCount = this.materials.filter(m => m.category === 'led').length;
    const bCount = this.materials.filter(m => m.category === 'blok').length;

    const elK = document.getElementById('stat-korpus-count');
    const elL = document.getElementById('stat-led-count');
    const elB = document.getElementById('stat-blok-count');

    if (elK) elK.textContent = kCount;
    if (elL) elL.textContent = lCount;
    if (elB) elB.textContent = bCount;
  },

  renderMaterialsTable() {
    const tbody = document.getElementById('admin-materials-tbody');
    if (!tbody) return;

    let filtered = this.materials;
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(m => m.category === this.currentCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.spec && m.spec.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">
            Xom-ashyo topilmadi
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => `
      <tr data-id="${item.id}">
        <td><span class="badge-cat badge-${item.category}">${item.category}</span></td>
        <td style="font-weight: 600; color: var(--text-main);">${item.name}</td>
        <td style="color: var(--text-secondary);">${item.spec || '-'}</td>
        <td style="color: var(--text-muted);">${item.unit}</td>
        <td style="font-weight: 700; color: #38bdf8;">$${item.price.toFixed(2)}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm btn-edit-material" data-id="${item.id}" style="padding: 4px 8px; margin-right: 4px;">
            ✏️
          </button>
          <button class="btn btn-icon-danger btn-delete-material" data-id="${item.id}" style="width: 24px; height: 24px; font-size: 10px; display: inline-flex;">
            🗑
          </button>
        </td>
      </tr>
    `).join('');

    // Attach row events
    tbody.querySelectorAll('.btn-edit-material').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = this.materials.find(m => String(m.id) === String(btn.dataset.id));
        if (item) this.openEditMaterialModal(item);
      });
    });

    tbody.querySelectorAll('.btn-delete-material').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = this.materials.find(m => String(m.id) === String(btn.dataset.id));
        if (item && confirm(`"${item.name}" pozitsiyasini oʻchirishni tasdiqlaysizmi?`)) {
          try {
            await API.deleteMaterial(item.id);
            await this.loadMaterials();
            await App.refreshMaterials();
            App.showToast('Muvaffaqiyatli oʻchirildi', 'success');
          } catch (e) {
            App.showToast('Xatolik: ' + e.message, 'error');
          }
        }
      });
    });
  },

  renderHistoryTable() {
    const tbody = document.getElementById('admin-history-tbody');
    if (!tbody) return;

    if (this.priceHistory.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 16px; color: var(--text-muted);">
            Narx o'zgarishi tarixi hozircha bo'sh
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.priceHistory.map(row => {
      const dt = new Date(row.created_at).toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.72rem;">${dt}</td>
          <td style="font-weight: 600;">${row.material_name} <small style="color:var(--text-muted)">(${row.spec})</small></td>
          <td style="color: #fb7185;">$${row.old_price.toFixed(2)}</td>
          <td style="color: #34d399; font-weight: 700;">$${row.new_price.toFixed(2)}</td>
          <td style="color: var(--text-secondary);">${row.changed_by}</td>
        </tr>
      `;
    }).join('');
  },

  renderUsersList() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;

    if (this.users.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem;">Foydalanuvchilar mavjud emas</div>';
      return;
    }

    container.innerHTML = this.users.map(u => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 6px;">
        <div>
          <div style="font-weight: 600; font-size: 0.82rem;">${u.name || 'Telegram foydalanuvchisi'}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">ID: ${u.telegram_id} ${u.username ? '@' + u.username : ''}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="role-badge ${u.role}">${u.role === 'admin' ? '🛡️ Admin' : '👤 Menejer'}</span>
          <button class="btn-icon-danger btn-delete-user" data-id="${u.telegram_id}" style="width: 26px; height: 26px; font-size: 10px;">✕</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Foydalanuvchini oʻchirishni tasdiqlaysizmi?')) {
          await API.deleteUser(btn.dataset.id);
          await this.loadUsers();
          App.showToast('Foydalanuvchi oʻchirildi', 'success');
        }
      });
    });
  },

  bindEvents() {
    // Category Sub Tabs
    document.querySelectorAll('.admin-cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCategory = tab.dataset.cat;
        this.renderMaterialsTable();
      });
    });

    // Search Material
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderMaterialsTable();
      });
    }

    // Add Material Button
    const btnAddMat = document.getElementById('btn-add-material');
    if (btnAddMat) {
      btnAddMat.addEventListener('click', () => this.openAddMaterialModal());
    }

    // Export Excel Button
    const btnExport = document.getElementById('btn-export-excel');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        window.location.href = '/api/materials/export-excel';
        App.showToast('Excel yuklab olinmoqda...', 'success');
      });
    }

    // Import Excel File Trigger
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          App.showToast('Excel import qilinmoqda...', 'info');
          const res = await API.importExcel(file);
          App.showToast(res.message || 'Muvaffaqiyatli import qilindi!', 'success');
          await this.loadMaterials();
          await App.refreshMaterials();
          fileInput.value = '';
        } catch (err) {
          App.showToast('Import xatosi: ' + err.message, 'error');
          fileInput.value = '';
        }
      });
    }

    // Add User Form
    const btnAddUser = document.getElementById('btn-add-user');
    if (btnAddUser) {
      btnAddUser.addEventListener('click', async () => {
        const idInput = document.getElementById('new-user-id');
        const nameInput = document.getElementById('new-user-name');
        const roleSelect = document.getElementById('new-user-role');

        const tgId = idInput ? idInput.value.trim() : '';
        const name = nameInput ? nameInput.value.trim() : '';
        const role = roleSelect ? roleSelect.value : 'menejer';

        if (!tgId) {
          App.showToast('Telegram ID ni kiriting', 'error');
          return;
        }

        try {
          await API.saveUser({ telegram_id: tgId, name, role, is_allowed: 1 });
          App.showToast('Foydalanuvchi saqlandi', 'success');
          idInput.value = '';
          nameInput.value = '';
          await this.loadUsers();
        } catch (err) {
          App.showToast('Xatolik: ' + err.message, 'error');
        }
      });
    }

    // Save System Settings Form
    const btnSaveGlobalSettings = document.getElementById('btn-save-global-settings');
    if (btnSaveGlobalSettings) {
      btnSaveGlobalSettings.addEventListener('click', async () => {
        const rate = parseFloat(document.getElementById('set-default-rate').value) || 12800;
        const brak = parseFloat(document.getElementById('set-default-brak').value) || 3;
        const profit = parseFloat(document.getElementById('set-default-profit').value) || 25;
        const batch = parseInt(document.getElementById('set-default-batch').value) || 10;

        try {
          await API.updateSettings({
            dollar_kursi: rate,
            brak_percent: brak,
            profit_percent: profit,
            batch_quantity: batch
          });
          Calculator.settings.dollar_kursi = rate;
          Calculator.settings.brak_percent = brak;
          Calculator.settings.profit_percent = profit;
          Calculator.settings.batch_quantity = batch;
          Calculator.renderSettingsBar();
          Calculator.calculate();
          App.showToast('Barcha standart sozlamalar saqlandi', 'success');
        } catch (err) {
          App.showToast('Saqlashda xatolik: ' + err.message, 'error');
        }
      });
    }
  },

  openAddMaterialModal() {
    const modal = document.getElementById('modal-material-edit');
    if (!modal) return;

    document.getElementById('mat-modal-title').textContent = 'Yangi Xom-Ashyo Qoʻshish';
    document.getElementById('mat-id').value = '';
    document.getElementById('mat-category').value = 'korpus';
    document.getElementById('mat-name').value = '';
    document.getElementById('mat-spec').value = '';
    document.getElementById('mat-unit').value = 'metr';
    document.getElementById('mat-price').value = '';

    modal.classList.add('active');
  },

  openEditMaterialModal(item) {
    const modal = document.getElementById('modal-material-edit');
    if (!modal) return;

    document.getElementById('mat-modal-title').textContent = 'Xom-Ashyoni Tahrirlash';
    document.getElementById('mat-id').value = item.id;
    document.getElementById('mat-category').value = item.category;
    document.getElementById('mat-name').value = item.name;
    document.getElementById('mat-spec').value = item.spec || '';
    document.getElementById('mat-unit').value = item.unit || 'metr';
    document.getElementById('mat-price').value = item.price;

    modal.classList.add('active');
  },

  async handleSaveMaterial() {
    const id = document.getElementById('mat-id').value;
    const category = document.getElementById('mat-category').value;
    const name = document.getElementById('mat-name').value.trim();
    const spec = document.getElementById('mat-spec').value.trim();
    const unit = document.getElementById('mat-unit').value.trim();
    const price = parseFloat(document.getElementById('mat-price').value);

    if (!name || isNaN(price)) {
      App.showToast('Nom va narxni toʻgʻri kiriting', 'error');
      return;
    }

    try {
      if (id) {
        await API.updateMaterial(id, { category, name, spec, unit, price, changed_by: App.currentUser.first_name || 'Admin' });
        App.showToast('Xom-ashyo yangilandi', 'success');
      } else {
        await API.addMaterial({ category, name, spec, unit, price, changed_by: App.currentUser.first_name || 'Admin' });
        App.showToast('Yangi xom-ashyo qoʻshildi', 'success');
      }

      document.getElementById('modal-material-edit').classList.remove('active');
      await this.loadMaterials();
      await this.loadPriceHistory();
      await App.refreshMaterials();
    } catch (err) {
      App.showToast('Xatolik: ' + err.message, 'error');
    }
  }
};
