// js/inventory.js
async function renderInventory() {
  const el = document.getElementById('page-inventory');
  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--slate);">Loading...</div>`;
  try {
    const res = await API.products.getInventory();
    const products = res.data;
    const outOfStock = products.filter(p => p.current_stock === 0).length;
    const lowStock = products.filter(p => p.current_stock > 0 && p.current_stock <= p.reorder_level).length;
    const expiring = products.filter(p => p.expiryAlert).length;

    el.innerHTML = `
      <div class="section-header"><div class="section-title">🗃️ Inventory Tracker</div></div>
      <div class="stats-grid">
        <div class="stat-card red"><div class="stat-icon">❌</div><div class="stat-label">Out of Stock</div><div class="stat-value">${outOfStock}</div><div class="stat-sub">Need immediate restock</div></div>
        <div class="stat-card gold"><div class="stat-icon">⚠️</div><div class="stat-label">Low Stock</div><div class="stat-value">${lowStock}</div><div class="stat-sub">Below reorder level</div></div>
        <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-label">Well Stocked</div><div class="stat-value">${products.length - outOfStock - lowStock}</div><div class="stat-sub">No action needed</div></div>
        <div class="stat-card"><div class="stat-icon">🕐</div><div class="stat-label">Expiry Alerts</div><div class="stat-value">${expiring}</div><div class="stat-sub">Check immediately</div></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th><th>Expiry</th><th>Closing Stock Formula</th></tr></thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td><span class="badge badge-blue">${p.category}</span></td>
                  <td><strong class="font-mono">${p.current_stock} ${p.unit}</strong></td>
                  <td>${p.reorder_level} ${p.unit}</td>
                  <td>${p.stockAlert ? `<span class="badge ${p.stockStatus === 'OUT' ? 'badge-red' : 'badge-orange'}">${p.stockAlert}</span>` : '<span class="badge badge-green">✓ OK</span>'}</td>
                  <td>${p.expiryAlert ? `<span class="badge badge-red">${p.expiryAlert}</span>` : (p.expiry_date || '<span class="text-muted">—</span>')}</td>
                  <td style="font-size:11px;color:var(--slate);">Opening(${p.opening_stock}) + Purchases − Sales = <strong>${p.current_stock}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}
