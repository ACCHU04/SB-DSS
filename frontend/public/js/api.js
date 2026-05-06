// js/api.js — Centralized API Layer
const API = {
  BASE: (window.SB_DSS_CONFIG && window.SB_DSS_CONFIG.apiBaseUrl) || '/api',

  async get(path) {
    const res = await fetch(this.BASE + path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(path, data) {
    const res = await fetch(this.BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  async put(path, data) {
    const res = await fetch(this.BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async del(path) {
    const res = await fetch(this.BASE + path, { method: 'DELETE' });
    return res.json();
  },

  // Products
  products: {
    getAll: () => API.get('/products'),
    getInventory: () => API.get('/products/inventory/status'),
    create: (data) => API.post('/products', data),
    update: (id, data) => API.put(`/products/${id}`, data),
    delete: (id) => API.del(`/products/${id}`),
  },

  // Sales
  sales: {
    getAll: (params = '') => API.get(`/sales${params}`),
    create: (data) => API.post('/sales', data),
    dailySummary: (date = '') => API.get(`/sales/summary/daily${date ? '?date=' + date : ''}`),
    weeklySummary: () => API.get('/sales/summary/weekly'),
    performance: () => API.get('/sales/analysis/performance'),
    categories: () => API.get('/sales/analysis/categories'),
  },

  // Decisions
  decisions: {
    engine: () => API.get('/decisions/engine'),
    health: () => API.get('/decisions/health-score'),
  },

  // Extras
  credits: {
    getAll: () => API.get('/credits'),
    create: (data) => API.post('/credits', data),
    pay: (id, amt) => API.put(`/credits/${id}/pay`, { amount_paid: amt }),
  },
  suppliers: {
    getAll: () => API.get('/suppliers'),
    create: (data) => API.post('/suppliers', data),
  },
  wastage: {
    getAll: () => API.get('/wastage'),
    create: (data) => API.post('/wastage', data),
  },
  requests: {
    getAll: () => API.get('/requests'),
    create: (data) => API.post('/requests', data),
  },
  competitors: {
    getAll: () => API.get('/competitors'),
    create: (data) => API.post('/competitors', data),
  },
  seasonal: {
    getAll: () => API.get('/seasonal'),
  },
  purchases: {
    getAll: () => API.get('/purchases'),
    create: (data) => API.post('/purchases', data),
  },
};
