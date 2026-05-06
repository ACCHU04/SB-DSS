// js/products.js
async function renderProducts() {
  const el = document.getElementById('page-products');
  el.innerHTML = `<div class="section-header">
    <div class="section-title">📦 Product Master</div>
    <button class="btn btn-primary" onclick="openAddProduct()">+ Add Product</button>
  </div><div style="text-align:center;padding:40px;color:var(--slate);">Loading...</div>`;

  try {
    const res = await API.products.getAll();
    const products = res.data;

    const tbody = products.map(p => {
      const margin = (((p.sell_price - p.buy_price) / p.sell_price) * 100).toFixed(0);
      const stockBadge = p.current_stock === 0 ? `<span class="badge badge-red">❌ Out</span>`
        : p.current_stock <= p.reorder_level ? `<span class="badge badge-orange">⚠️ Low</span>`
        : `<span class="badge badge-green">✓ OK</span>`;

      const expiryBadge = p.expiry_date
        ? (() => {
            const today = new Date().toISOString().split('T')[0];
            const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
            if (p.expiry_date <= today) return `<span class="badge badge-red">🔴 Expired</span>`;
            if (p.expiry_date <= in30) return `<span class="badge badge-orange">⚠️ Expiring</span>`;
            return `<span class="badge badge-green">OK</span>`;
          })()
        : '<span class="text-muted">—</span>';

      return `<tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-blue">${p.category}</span></td>
        <td>₹${p.buy_price}</td>
        <td>₹${p.sell_price}</td>
        <td><span class="badge badge-gold">${margin}%</span></td>
        <td>${p.current_stock} ${p.unit} ${stockBadge}</td>
        <td>${p.reorder_level}</td>
        <td>${p.supplier_name || '—'}</td>
        <td>${expiryBadge}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openEditProduct(${p.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id}, '${p.name}')">🗑️</button>
        </td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">📦 Product Master</div>
        <button class="btn btn-primary" onclick="openAddProduct()">+ Add Product</button>
      </div>
      ${products.length === 0 ? `<div class="empty-state"><div class="emoji">📦</div><p>No products yet. Add your first product!</p></div>` : `
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th><th>Category</th><th>Buy ₹</th><th>Sell ₹</th>
                <th>Margin</th><th>Stock</th><th>Reorder At</th><th>Supplier</th>
                <th>Expiry</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </div>`}
    `;
  } catch (err) {
    el.innerHTML += `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function openAddProduct() {
  openModal('➕ Add New Product', productForm(), [
    { label: 'Save Product', cls: 'btn-primary', action: 'saveProduct()' }
  ]);
}

async function openEditProduct(id) {
  const res = await API.products.getAll();
  const p = res.data.find(x => x.id === id);
  if (!p) return;
  openModal('✏️ Edit Product', productForm(p), [
    { label: 'Update', cls: 'btn-primary', action: `updateProduct(${id})` }
  ]);
}

function productForm(p = {}) {
  const cats = ['Snacks', 'Grocery', 'Personal Care', 'Beverages', 'Dairy', 'Confectionery', 'Stationery', 'Household', 'Medicine', 'Other'];
  return `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Product Name *</label>
        <input id="f-name" value="${p.name || ''}" placeholder="e.g. Parle-G Biscuit (10 pcs)"/>
      </div>
      <div class="form-group">
        <label>Category *</label>
        <select id="f-cat">
          ${cats.map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Unit</label>
        <select id="f-unit">
          ${['pcs','kg','g','L','ml','box','pack','dozen'].map(u => `<option value="${u}" ${p.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Buy Price (₹) *</label>
        <input id="f-buy" type="number" step="0.01" value="${p.buy_price || ''}" placeholder="0.00"/>
      </div>
      <div class="form-group">
        <label>Sell Price (₹) *</label>
        <input id="f-sell" type="number" step="0.01" value="${p.sell_price || ''}" placeholder="0.00"/>
      </div>
      <div class="form-group">
        <label>Opening Stock</label>
        <input id="f-stock" type="number" value="${p.opening_stock || p.current_stock || 0}"/>
      </div>
      <div class="form-group">
        <label>Reorder Level</label>
        <input id="f-reorder" type="number" value="${p.reorder_level || 10}"/>
      </div>
      <div class="form-group">
        <label>GST %</label>
        <select id="f-gst">
          ${[0,5,12,18,28].map(g => `<option value="${g}" ${p.gst_percent == g ? 'selected' : ''}>${g}%</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Supplier Name</label>
        <input id="f-supplier" value="${p.supplier_name || ''}" placeholder="Supplier / Distributor"/>
      </div>
      <div class="form-group">
        <label>Expiry Date</label>
        <input id="f-expiry" type="date" value="${p.expiry_date || ''}"/>
      </div>
    </div>
  `;
}

async function saveProduct() {
  const data = {
    name: document.getElementById('f-name').value.trim(),
    category: document.getElementById('f-cat').value,
    unit: document.getElementById('f-unit').value,
    buy_price: parseFloat(document.getElementById('f-buy').value),
    sell_price: parseFloat(document.getElementById('f-sell').value),
    opening_stock: parseInt(document.getElementById('f-stock').value) || 0,
    reorder_level: parseInt(document.getElementById('f-reorder').value) || 10,
    gst_percent: parseFloat(document.getElementById('f-gst').value),
    supplier_name: document.getElementById('f-supplier').value,
    expiry_date: document.getElementById('f-expiry').value || null,
  };
  if (!data.name || !data.buy_price || !data.sell_price) return showToast('Fill required fields', 'error');
  try {
    await API.products.create(data);
    closeModal();
    showToast('✅ Product added successfully', 'success');
    renderProducts();
  } catch (err) { showToast(err.message, 'error'); }
}

async function updateProduct(id) {
  const data = {
    name: document.getElementById('f-name').value,
    category: document.getElementById('f-cat').value,
    unit: document.getElementById('f-unit').value,
    buy_price: parseFloat(document.getElementById('f-buy').value),
    sell_price: parseFloat(document.getElementById('f-sell').value),
    reorder_level: parseInt(document.getElementById('f-reorder').value),
    gst_percent: parseFloat(document.getElementById('f-gst').value),
    supplier_name: document.getElementById('f-supplier').value,
    expiry_date: document.getElementById('f-expiry').value || null,
  };
  try {
    await API.products.update(id, data);
    closeModal();
    showToast('✅ Product updated', 'success');
    renderProducts();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await API.products.delete(id);
    showToast('🗑️ Product deleted', 'success');
    renderProducts();
  } catch (err) { showToast(err.message, 'error'); }
}
