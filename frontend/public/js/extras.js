// js/extras.js — Suppliers, Wastage, Requests, Competitors, Seasonal, Purchases, Decision Engine

// ===== DECISION ENGINE =====
async function renderDecision() {
  const el = document.getElementById('page-decision');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading Decision Engine...</div>`;
  try {
    const [res, health] = await Promise.all([API.decisions.engine(), API.decisions.health()]);
    const decisions = res.data;
    const h = health.data;

    const counts = { 'BUY NOW': 0, 'ORDER SOON': 0, 'WAIT': 0, 'TRY SMALL QTY': 0, 'REDUCE ORDER': 0, 'STOP ORDERING': 0 };
    decisions.forEach(d => { if (counts[d.decision] !== undefined) counts[d.decision]++; });

    el.innerHTML = `
      <div class="section-header"><div class="section-title">🧠 Decision Engine</div></div>
      <div class="health-card">
        <div class="health-score-circle">
          <div class="health-score-number" style="color:${h.statusColor}">${h.overallScore}</div>
          <div class="health-score-label">Business Score</div>
        </div>
        <div class="health-details">
          <div class="health-status">${h.status}</div>
          <div class="health-advice">${h.advice}</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
            ${h.details.map(d => `<div style="background:rgba(255,255,255,0.1);padding:8px 14px;border-radius:8px;">
              <div style="font-size:11px;opacity:0.7">${d.name}</div>
              <div style="font-size:18px;font-weight:700;font-family:'Rajdhani',sans-serif;">${d.score}/10</div>
              <div style="font-size:10px;opacity:0.6">${d.desc}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card red"><div class="stat-label">🔴 Buy Now</div><div class="stat-value">${counts['BUY NOW']}</div></div>
        <div class="stat-card gold"><div class="stat-label">🟠 Order Soon</div><div class="stat-value">${counts['ORDER SOON']}</div></div>
        <div class="stat-card green"><div class="stat-label">🟢 Wait</div><div class="stat-value">${counts['WAIT']}</div></div>
        <div class="stat-card blue"><div class="stat-label">🔵 Try Small</div><div class="stat-value">${counts['TRY SMALL QTY']}</div></div>
        <div class="stat-card"><div class="stat-label">⬇️ Reduce/Stop</div><div class="stat-value">${counts['REDUCE ORDER']+counts['STOP ORDERING']}</div></div>
      </div>

      <div class="decision-grid">
        ${decisions.map(d => `
          <div class="decision-card">
            <span class="decision-badge" style="background:${d.color}">${d.decision}</span>
            ${d.expiryWarning ? `<div class="alert alert-danger" style="padding:6px 10px;margin-bottom:8px;font-size:12px;">⚠️ ${d.expiryWarning}</div>` : ''}
            <div class="decision-product-name">${d.name}</div>
            <div class="decision-reason">${d.reason}</div>
            <div class="decision-stats">
              <div class="dstat"><div class="dstat-val">${d.current_stock}</div><div class="dstat-lbl">Stock</div></div>
              <div class="dstat"><div class="dstat-val">${d.weekly_sales}</div><div class="dstat-lbl">Sold/Week</div></div>
              <div class="dstat"><div class="dstat-val">${d.days_left}</div><div class="dstat-lbl">Days Left</div></div>
              <div class="dstat"><div class="dstat-val">${d.profit_margin}%</div><div class="dstat-lbl">Margin</div></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

// ===== PURCHASES =====
async function renderPurchases() {
  const el = document.getElementById('page-purchases');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const [purchRes, prodRes] = await Promise.all([API.purchases.getAll(), API.products.getAll()]);
    const purchases = purchRes.data;
    const products = prodRes.data;

    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">🛒 Purchase / Stock-In</div>
        <button class="btn btn-primary" onclick="openAddPurchase(${JSON.stringify(products).replace(/"/g,'&quot;')})">+ Record Purchase</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          ${purchases.length===0 ? `<div class="empty-state"><div class="emoji">🛒</div><p>No purchases recorded yet.</p></div>` :
          `<table><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Buy Price</th><th>Total Cost</th><th>Supplier</th></tr></thead>
          <tbody>${purchases.map(p=>`
            <tr><td>${p.purchase_date}</td><td>${p.product_name}</td><td>${p.quantity_purchased}</td>
            <td>₹${p.buy_price}</td><td class="font-mono">₹${(p.quantity_purchased*p.buy_price).toFixed(0)}</td>
            <td>${p.supplier_name||'—'}</td></tr>
          `).join('')}</tbody></table>`}
        </div>
      </div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}

function openAddPurchase(products) {
  openModal('🛒 Record Purchase', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Product *</label>
        <select id="p-product">${products.map(p=>`<option value="${p.id}" data-buy="${p.buy_price}">${p.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Quantity *</label><input id="p-qty" type="number" min="1" value="10"/></div>
      <div class="form-group"><label>Buy Price (₹)</label><input id="p-price" type="number" step="0.01" placeholder="Leave blank for default"/></div>
      <div class="form-group"><label>Supplier</label><input id="p-supplier" placeholder="Supplier name"/></div>
      <div class="form-group"><label>Date</label><input id="p-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
    </div>
  `, [{ label: 'Record Purchase', cls: 'btn-primary', action: 'savePurchase()' }]);
}

async function savePurchase() {
  const data = {
    product_id: parseInt(document.getElementById('p-product').value),
    quantity_purchased: parseInt(document.getElementById('p-qty').value),
    buy_price: parseFloat(document.getElementById('p-price').value) || null,
    supplier_name: document.getElementById('p-supplier').value,
    purchase_date: document.getElementById('p-date').value
  };
  if (!data.product_id || !data.quantity_purchased) return showToast('Product and quantity required', 'error');
  try {
    await API.purchases.create(data);
    closeModal(); showToast('✅ Purchase recorded & stock updated', 'success'); renderPurchases();
  } catch(err) { showToast(err.message, 'error'); }
}

// ===== WASTAGE =====
async function renderWastage() {
  const el = document.getElementById('page-wastage');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const [wRes, pRes] = await Promise.all([API.wastage.getAll(), API.products.getAll()]);
    const items = wRes.data;
    const products = pRes.data;

    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">🗑️ Wastage & Damage Log</div>
        <button class="btn btn-primary" onclick="openAddWastage(${JSON.stringify(products).replace(/"/g,'&quot;')})">+ Log Damage</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card red"><div class="stat-icon">💸</div><div class="stat-label">Total Loss from Wastage</div><div class="stat-value">₹${parseFloat(wRes.total_loss||0).toFixed(0)}</div></div>
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Total Entries</div><div class="stat-value">${items.length}</div></div>
      </div>
      <div class="card"><div class="table-wrap">
        ${items.length===0 ? `<div class="empty-state"><div class="emoji">✅</div><p>No wastage recorded. Keep it up!</p></div>` :
        `<table><thead><tr><th>Date</th><th>Product</th><th>Qty Damaged</th><th>Reason</th><th>Est. Loss</th></tr></thead>
        <tbody>${items.map(i=>`<tr>
          <td>${i.damage_date}</td><td>${i.product_name}</td><td>${i.quantity_damaged}</td>
          <td>${i.reason||'—'}</td><td class="text-red font-mono">₹${parseFloat(i.estimated_loss||0).toFixed(0)}</td>
        </tr>`).join('')}</tbody></table>`}
      </div></div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}

function openAddWastage(products) {
  openModal('🗑️ Log Wastage/Damage', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Product *</label>
        <select id="w-product"><option value="">-- Select --</option>${products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Qty Damaged *</label><input id="w-qty" type="number" min="1" value="1"/></div>
      <div class="form-group"><label>Reason</label><input id="w-reason" placeholder="Expired, broken, etc."/></div>
      <div class="form-group"><label>Date</label><input id="w-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
    </div>
  `, [{ label: 'Log Damage', cls: 'btn-danger', action: 'saveWastage()' }]);
}

async function saveWastage() {
  const sel = document.getElementById('w-product');
  const data = {
    product_id: parseInt(sel.value) || null,
    product_name: sel.options[sel.selectedIndex]?.text || '',
    quantity_damaged: parseInt(document.getElementById('w-qty').value),
    reason: document.getElementById('w-reason').value,
    damage_date: document.getElementById('w-date').value
  };
  if (!data.product_name || !data.quantity_damaged) return showToast('Product and quantity required', 'error');
  try {
    await API.wastage.create(data);
    closeModal(); showToast('⚠️ Wastage logged', 'success'); renderWastage();
  } catch(err) { showToast(err.message, 'error'); }
}

// ===== SUPPLIERS =====
async function renderSuppliers() {
  const el = document.getElementById('page-suppliers');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const res = await API.suppliers.getAll();
    const suppliers = res.data;
    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">🚚 Supplier Tracker</div>
        <button class="btn btn-primary" onclick="openAddSupplier()">+ Add Supplier</button>
      </div>
      <div class="card"><div class="table-wrap">
        ${suppliers.length===0 ? `<div class="empty-state"><div class="emoji">🚚</div><p>No suppliers added yet.</p></div>` :
        `<table><thead><tr><th>Supplier Name</th><th>Phone</th><th>Products Supplied</th><th>Avg Delivery (days)</th><th>Notes</th></tr></thead>
        <tbody>${suppliers.map(s=>`<tr>
          <td><strong>${s.name}</strong></td><td>${s.phone||'—'}</td>
          <td style="max-width:220px;font-size:12px;">${s.products_supplied||'—'}</td>
          <td>${s.avg_delivery_days} days</td><td>${s.notes||'—'}</td>
        </tr>`).join('')}</tbody></table>`}
      </div></div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}

function openAddSupplier() {
  openModal('🚚 Add Supplier', `
    <div class="form-grid">
      <div class="form-group"><label>Name *</label><input id="sup-name" placeholder="Supplier / Distributor name"/></div>
      <div class="form-group"><label>Phone</label><input id="sup-phone" placeholder="Mobile number"/></div>
      <div class="form-group" style="grid-column:1/-1"><label>Products Supplied</label><input id="sup-products" placeholder="Parle-G, Maggi, Lays..."/></div>
      <div class="form-group"><label>Avg Delivery Days</label><input id="sup-days" type="number" value="2"/></div>
      <div class="form-group"><label>Notes</label><input id="sup-notes" placeholder="Any notes..."/></div>
    </div>
  `, [{ label: 'Add Supplier', cls: 'btn-primary', action: 'saveSupplier()' }]);
}

async function saveSupplier() {
  const data = {
    name: document.getElementById('sup-name').value.trim(),
    phone: document.getElementById('sup-phone').value,
    products_supplied: document.getElementById('sup-products').value,
    avg_delivery_days: parseInt(document.getElementById('sup-days').value)||2,
    notes: document.getElementById('sup-notes').value
  };
  if (!data.name) return showToast('Supplier name required', 'error');
  try {
    await API.suppliers.create(data);
    closeModal(); showToast('✅ Supplier added', 'success'); renderSuppliers();
  } catch(err) { showToast(err.message, 'error'); }
}

// ===== COMPETITOR PRICES =====
async function renderCompetitor() {
  const el = document.getElementById('page-competitor');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const [cRes, pRes] = await Promise.all([API.competitors.getAll(), API.products.getAll()]);
    const items = cRes.data;
    const products = pRes.data;
    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">🏷️ Competitor Price Tracker</div>
        <button class="btn btn-primary" onclick="openAddCompetitor(${JSON.stringify(products).replace(/"/g,'&quot;')})">+ Add Comparison</button>
      </div>
      <div class="card"><div class="table-wrap">
        ${items.length===0 ? `<div class="empty-state"><div class="emoji">🏷️</div><p>No competitor prices tracked yet.</p></div>` :
        `<table><thead><tr><th>Product</th><th>Our Price</th><th>Competitor</th><th>Competitor Name</th><th>Difference</th><th>Action</th><th>Date</th></tr></thead>
        <tbody>${items.map(i=>{
          const diff = i.our_price - i.competitor_price;
          return `<tr>
            <td>${i.product_name}</td>
            <td class="font-mono">₹${i.our_price}</td>
            <td class="font-mono">₹${i.competitor_price}</td>
            <td>${i.competitor_name||'—'}</td>
            <td class="${diff>0?'text-red':diff<0?'text-green':''}font-mono">${diff>0?'+'+diff.toFixed(0):diff.toFixed(0)}</td>
            <td style="font-size:12px;">${diff>0?'⬇️ Consider reducing price':diff<0?'✅ Your price is competitive':'➡️ Same price'}</td>
            <td>${i.recorded_date}</td>
          </tr>`;
        }).join('')}</tbody></table>`}
      </div></div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}

function openAddCompetitor(products) {
  openModal('🏷️ Add Competitor Price', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1">
        <label>Product *</label>
        <select id="cp-product" onchange="fillOurPrice(${JSON.stringify(products).replace(/"/g,'&quot;')})">
          <option value="">-- Select --</option>${products.map(p=>`<option value="${p.id}" data-sell="${p.sell_price}" data-name="${p.name}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Our Price (₹)</label><input id="cp-our" type="number" step="0.01"/></div>
      <div class="form-group"><label>Competitor Price (₹) *</label><input id="cp-comp" type="number" step="0.01"/></div>
      <div class="form-group"><label>Competitor Name</label><input id="cp-name" placeholder="Shop name nearby"/></div>
    </div>
  `, [{ label: 'Save', cls: 'btn-primary', action: 'saveCompetitor()' }]);
}

function fillOurPrice(products) {
  const sel = document.getElementById('cp-product');
  const opt = sel.options[sel.selectedIndex];
  if (opt.dataset.sell) document.getElementById('cp-our').value = opt.dataset.sell;
}

async function saveCompetitor() {
  const sel = document.getElementById('cp-product');
  const opt = sel.options[sel.selectedIndex];
  const data = {
    product_id: parseInt(sel.value)||null,
    product_name: opt.dataset.name||sel.value,
    our_price: parseFloat(document.getElementById('cp-our').value),
    competitor_price: parseFloat(document.getElementById('cp-comp').value),
    competitor_name: document.getElementById('cp-name').value
  };
  if (!data.competitor_price) return showToast('Competitor price required','error');
  try {
    await API.competitors.create(data);
    closeModal(); showToast('✅ Price comparison saved','success'); renderCompetitor();
  } catch(err) { showToast(err.message,'error'); }
}

// ===== CUSTOMER REQUESTS =====
async function renderRequests() {
  const el = document.getElementById('page-requests');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const res = await API.requests.getAll();
    const items = res.data;
    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">💬 Customer Request Log</div>
        <button class="btn btn-primary" onclick="openAddRequest()">+ Log Request</button>
      </div>
      <div class="card"><div class="table-wrap">
        ${items.length===0 ? `<div class="empty-state"><div class="emoji">💬</div><p>No customer requests yet.</p></div>` :
        `<table><thead><tr><th>Product Requested</th><th>Times Asked</th><th>Currently Stocked</th><th>Recommendation</th><th>Date</th></tr></thead>
        <tbody>${items.map(i=>{
          const rec = i.times_requested>=8?'🔴 Add to stock — VERY HIGH demand'
            :i.times_requested>=5?'🟠 Add to stock — HIGH demand'
            :i.times_requested>=3?'🟡 Try small quantity — MEDIUM demand'
            :'🟢 Monitor — LOW demand for now';
          return `<tr>
            <td><strong>${i.product_name}</strong></td>
            <td><span class="badge badge-gold">${i.times_requested}x</span></td>
            <td>${i.currently_stocked?'✅ Yes':'❌ No'}</td>
            <td style="font-size:12px;">${rec}</td>
            <td>${i.request_date}</td>
          </tr>`;
        }).join('')}</tbody></table>`}
      </div></div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}

function openAddRequest() {
  openModal('💬 Log Customer Request', `
    <div class="form-grid">
      <div class="form-group" style="grid-column:1/-1"><label>Product Name *</label><input id="req-name" placeholder="What did the customer ask for?"/></div>
      <div class="form-group" style="grid-column:1/-1"><label>Notes</label><input id="req-notes" placeholder="Any additional details..."/></div>
    </div>
    <div class="alert alert-info">💡 If product already logged, its request count will increase by 1.</div>
  `, [{ label: 'Log Request', cls: 'btn-primary', action: 'saveRequest()' }]);
}

async function saveRequest() {
  const data = { product_name: document.getElementById('req-name').value.trim(), notes: document.getElementById('req-notes').value };
  if (!data.product_name) return showToast('Product name required','error');
  try {
    await API.requests.create(data);
    closeModal(); showToast('✅ Request logged','success'); renderRequests();
  } catch(err) { showToast(err.message,'error'); }
}

// ===== SEASONAL PLANNER =====
async function renderSeasonal() {
  const el = document.getElementById('page-seasonal');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const res = await API.seasonal.getAll();
    const items = res.data;
    const demandColors = { 'Very High':'badge-red','High':'badge-orange','Medium-High':'badge-gold','Medium':'badge-blue' };
    el.innerHTML = `
      <div class="section-header"><div class="section-title">🎉 Festival & Seasonal Demand Planner</div></div>
      <div class="alert alert-info">📅 Plan your stock in advance for festivals and seasons to capture peak demand.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
        ${items.map(i=>{
          const badge = demandColors[i.expected_demand]||'badge-gray';
          return `<div class="card" style="margin:0;">
            <div class="card-header">
              <span class="card-title">🎊 ${i.event_name}</span>
              <span class="badge ${badge}">${i.expected_demand}</span>
            </div>
            <div class="card-body">
              <div style="margin-bottom:8px;font-size:13px;color:var(--slate);">📅 ${i.event_month}</div>
              <div style="font-size:13px;"><strong>Stock Up On:</strong></div>
              <div style="font-size:13px;margin-top:4px;color:var(--ink);">${i.products_to_stock}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch(err) { el.innerHTML=`<div class="alert alert-danger">${err.message}</div>`; }
}
