// js/credits.js
async function renderCredits() {
  const el = document.getElementById('page-credits');
  el.innerHTML = `<div style="text-align:center;padding:40px;">Loading...</div>`;
  try {
    const res = await API.credits.getAll();
    const credits = res.data;
    const totals = res.totals;

    el.innerHTML = `
      <div class="section-header">
        <div class="section-title">📒 Udhar (Credit) Tracker</div>
        <button class="btn btn-primary" onclick="openAddCredit()">+ Add Credit Entry</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card red"><div class="stat-icon">📤</div><div class="stat-label">Total Given</div><div class="stat-value">₹${parseFloat(totals.total_given||0).toFixed(0)}</div></div>
        <div class="stat-card green"><div class="stat-icon">📥</div><div class="stat-label">Total Received</div><div class="stat-value">₹${parseFloat(totals.total_received||0).toFixed(0)}</div></div>
        <div class="stat-card gold"><div class="stat-icon">⏳</div><div class="stat-label">Still Pending</div><div class="stat-value">₹${parseFloat(totals.total_pending||0).toFixed(0)}</div></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          ${credits.length === 0 ? `<div class="empty-state"><div class="emoji">📒</div><p>No credit entries yet.</p></div>` :
          `<table>
            <thead><tr><th>Customer</th><th>Product</th><th>Amount</th><th>Paid</th><th>Pending</th><th>Status</th><th>Date</th><th>Due Date</th><th>Action</th></tr></thead>
            <tbody>
              ${credits.map(c => {
                const pending = c.amount - c.amount_paid;
                const today = new Date().toISOString().split('T')[0];
                const overdue = c.due_date && c.due_date < today && c.status !== 'paid';
                return `<tr>
                  <td><strong>${c.customer_name}</strong></td>
                  <td>${c.product_name || '—'}</td>
                  <td class="font-mono">₹${c.amount}</td>
                  <td class="text-green font-mono">₹${c.amount_paid}</td>
                  <td class="${pending>0?'text-red':'text-green'} font-mono">₹${pending.toFixed(0)}</td>
                  <td>
                    <span class="badge ${c.status==='paid'?'badge-green':overdue?'badge-red':'badge-orange'}">
                      ${c.status==='paid'?'✅ Paid':overdue?'🔴 Overdue':'⏳ Pending'}
                    </span>
                  </td>
                  <td>${c.credit_date}</td>
                  <td>${c.due_date || '—'}</td>
                  <td>${c.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="collectPayment(${c.id}, ${pending})">Collect</button>` : '—'}</td>
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

function openAddCredit() {
  openModal('📒 Add Credit (Udhar) Entry', `
    <div class="form-grid">
      <div class="form-group"><label>Customer Name *</label><input id="c-name" placeholder="Customer name"/></div>
      <div class="form-group"><label>Product/Reason</label><input id="c-product" placeholder="What was taken on credit?"/></div>
      <div class="form-group"><label>Amount (₹) *</label><input id="c-amount" type="number" step="0.01" placeholder="0.00"/></div>
      <div class="form-group"><label>Due Date</label><input id="c-due" type="date"/></div>
      <div class="form-group" style="grid-column:1/-1"><label>Notes</label><input id="c-notes" placeholder="Any notes..."/></div>
    </div>
  `, [{ label: 'Add Entry', cls: 'btn-primary', action: 'saveCredit()' }]);
}

async function saveCredit() {
  const data = {
    customer_name: document.getElementById('c-name').value.trim(),
    product_name: document.getElementById('c-product').value,
    amount: parseFloat(document.getElementById('c-amount').value),
    due_date: document.getElementById('c-due').value || null,
    notes: document.getElementById('c-notes').value
  };
  if (!data.customer_name || !data.amount) return showToast('Name and amount required', 'error');
  try {
    await API.credits.create(data);
    closeModal(); showToast('✅ Credit entry added', 'success'); renderCredits();
  } catch (err) { showToast(err.message, 'error'); }
}

async function collectPayment(id, pending) {
  const amt = prompt(`Collecting payment. Max pending: ₹${pending.toFixed(0)}\nEnter amount received:`);
  if (!amt || isNaN(parseFloat(amt))) return;
  try {
    await API.credits.pay(id, parseFloat(amt));
    showToast('✅ Payment recorded', 'success'); renderCredits();
  } catch (err) { showToast(err.message, 'error'); }
}
