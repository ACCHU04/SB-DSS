// js/sales.js
async function renderSales() {
  const el = document.getElementById('page-sales');
  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--slate);">Loading...</div>`;

  try {
    const [productsRes, salesRes] = await Promise.all([
      API.products.getAll(),
      API.sales.getAll()
    ]);
    const products = productsRes.data;
    const sales = salesRes.data.slice(0, 50);

    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">🧾 Record Daily Sale</div>
      </div>

      <!-- Quick Sale Form -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><span class="card-title">⚡ Quick Sale Entry</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Product *</label>
              <select id="s-product" onchange="updateSalePreview()">
                <option value="">-- Select Product --</option>
                ${products.map(p => `<option value="${p.id}" data-buy="${p.buy_price}" data-sell="${p.sell_price}" data-stock="${p.current_stock}" data-gst="${p.gst_percent}">${p.name} (Stock: ${p.current_stock} ${p.unit})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Quantity *</label>
              <input id="s-qty" type="number" min="1" value="1" oninput="updateSalePreview()" placeholder="Qty"/>
            </div>
            <div class="form-group">
              <label>Payment Mode</label>
              <select id="s-payment">
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="credit">📒 Udhar (Credit)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Sale Date</label>
              <input id="s-date" type="date" value="${new Date().toISOString().split('T')[0]}"/>
            </div>
          </div>

          <!-- Sale Preview -->
          <div id="sale-preview" style="display:none; background:var(--smoke); border-radius:var(--radius-sm); padding:14px; margin-bottom:16px;">
            <div style="display:flex;gap:20px;flex-wrap:wrap;">
              <div><div class="stat-label">Sell Price</div><div class="font-mono" style="font-size:18px;" id="prev-sell">—</div></div>
              <div><div class="stat-label">Total Amount</div><div class="font-mono" style="font-size:18px;color:var(--saffron);" id="prev-total">—</div></div>
              <div><div class="stat-label">GST Amount</div><div class="font-mono" style="font-size:18px;" id="prev-gst">—</div></div>
              <div><div class="stat-label">Profit</div><div class="font-mono" style="font-size:18px;color:var(--jade);" id="prev-profit">—</div></div>
            </div>
          </div>

          <button class="btn btn-primary" onclick="recordSale()">✅ Record Sale</button>
        </div>
      </div>

      <!-- Recent Sales -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Recent Sales (Last 50)</span>
        </div>
        <div class="table-wrap">
          ${sales.length === 0
            ? `<div class="empty-state"><div class="emoji">🧾</div><p>No sales recorded yet.</p></div>`
            : `<table>
              <thead><tr>
                <th>Date</th><th>Product</th><th>Qty</th><th>Rate</th>
                <th>Total</th><th>Profit</th><th>GST</th><th>Payment</th>
              </tr></thead>
              <tbody>
                ${sales.map(s => {
                  const total = s.quantity_sold * s.sell_price;
                  const profit = s.quantity_sold * (s.sell_price - s.buy_price);
                  const pmBadge = s.payment_mode === 'cash' ? 'badge-green'
                    : s.payment_mode === 'upi' ? 'badge-blue' : 'badge-red';
                  return `<tr>
                    <td>${s.sale_date}</td>
                    <td>${s.product_name}</td>
                    <td>${s.quantity_sold}</td>
                    <td>₹${s.sell_price}</td>
                    <td>₹${total.toFixed(0)}</td>
                    <td class="text-green">₹${profit.toFixed(0)}</td>
                    <td>₹${parseFloat(s.gst_amount || 0).toFixed(2)}</td>
                    <td><span class="badge ${pmBadge}">${s.payment_mode}</span></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function updateSalePreview() {
  const sel = document.getElementById('s-product');
  const opt = sel.options[sel.selectedIndex];
  const qty = parseInt(document.getElementById('s-qty').value) || 0;
  const preview = document.getElementById('sale-preview');

  if (!sel.value || qty <= 0) { preview.style.display = 'none'; return; }

  const sell = parseFloat(opt.dataset.sell);
  const buy = parseFloat(opt.dataset.buy);
  const gstPct = parseFloat(opt.dataset.gst);
  const total = sell * qty;
  const gst = (total * gstPct) / 100;
  const profit = (sell - buy) * qty;

  document.getElementById('prev-sell').textContent = `₹${sell}`;
  document.getElementById('prev-total').textContent = `₹${total.toFixed(2)}`;
  document.getElementById('prev-gst').textContent = `₹${gst.toFixed(2)}`;
  document.getElementById('prev-profit').textContent = `₹${profit.toFixed(2)}`;
  preview.style.display = 'block';
}

async function recordSale() {
  const product_id = parseInt(document.getElementById('s-product').value);
  const quantity_sold = parseInt(document.getElementById('s-qty').value);
  const payment_mode = document.getElementById('s-payment').value;
  const sale_date = document.getElementById('s-date').value;

  if (!product_id || !quantity_sold) return showToast('Select a product and quantity', 'error');

  try {
    await API.sales.create({ product_id, quantity_sold, payment_mode, sale_date });
    showToast('✅ Sale recorded successfully!', 'success');
    renderSales();
  } catch (err) { showToast('❌ ' + err.message, 'error'); }
}
