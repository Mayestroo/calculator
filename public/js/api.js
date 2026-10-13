// ==========================================================================
// API CLIENT MODULE
// ==========================================

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    try {
      const res = await fetch(this.baseUrl + endpoint, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server xatosi yuz berdi');
      }
      return data;
    } catch (err) {
      console.warn(`API call failed for ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth & User verification
  async validateUser(initData, demoUserId, demoRole) {
    return this.request('/api/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ initData, demoUserId, demoRole })
    });
  },

  // Materials
  async getMaterials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/materials${query ? '?' + query : ''}`);
  },

  async addMaterial(data) {
    return this.request('/api/materials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateMaterial(id, data) {
    return this.request(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteMaterial(id) {
    return this.request(`/api/materials/${id}`, {
      method: 'DELETE'
    });
  },

  async getPriceHistory(limit = 100) {
    return this.request(`/api/price-history?limit=${limit}`);
  },

  // Settings
  async getSettings() {
    return this.request('/api/settings');
  },

  async updateSettings(data) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Calculations
  async getCalculations(telegramId = '') {
    const q = telegramId ? `?telegram_id=${encodeURIComponent(telegramId)}` : '';
    return this.request(`/api/calculations${q}`);
  },

  async getCalculationById(id) {
    return this.request(`/api/calculations/${id}`);
  },

  async saveCalculation(data) {
    return this.request('/api/calculations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteCalculation(id) {
    return this.request(`/api/calculations/${id}`, {
      method: 'DELETE'
    });
  },

  // Excel Import
  async importExcel(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/materials/import-excel', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Excel importda xatolik');
    return data;
  },

  // Users
  async getUsers() {
    return this.request('/api/users');
  },

  async saveUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(telegramId) {
    return this.request(`/api/users/${telegramId}`, {
      method: 'DELETE'
    });
  }
};
