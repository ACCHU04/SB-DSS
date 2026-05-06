// js/dashboard.js
let salesChart = null;
let categoryChart = null;

async function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--slate);">Loading dashboard...</div>`;

  try {
    const [daily, weekly, health, categories] = await Promise.all([
      API.sales.dailySummary(),
      API.sales.weeklySummary(),
      API.decisions.health(),
      API.sales.categories()
    ]);

    const d = daily.data.summary;
    const w = weekly.data;
    const h = health.data;
    const cats = categories.data;

    const trendIcon = parseFloat(w.trend) >= 0 ? '📈' : '📉';
    const trendColor = parseFloat(w.trend) >= 0 ? 'var(--jade)' : 'var(--red-alert)';

    el.innerHTML = `
      <!-- Health Score -->
      <div class="health-card">
        <div class="health-score-circle" style="border-color:${h.statusColor}40">
          <div class="health-score-number" style="color:${h.statusColor}">${h.overallScore}</div>
          <div class="health-score-label">/ 10</div>
        </div>
        <div class="health-details">
          <div class="health-status">${h.status}</div>
          <div class="health-advice">${h.advice}</div>
          <div class="health-bars">
            ${h.details.map(d => `
              <div class="health-bar-item">
                <span class="health-bar-name">${d.name}</span>
                <div class="health-bar-track"><div class="health-bar-fill" style="width:${d.score * 10}%"></div></div>
                <span class="health-bar-score">${d.score}/10</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Today Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Today's Revenue</div>
          <div class="stat-value">₹${(d.total_revenue || 0).toFixed(0)}</div>
          <div class="stat-sub">${d.total_transactions || 0} transactions</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">📈</div>
          <div class="stat-label">Today's Profit</div>
          <div class="stat-value">₹${(d.total_profit || 0).toFixed(0)}</div>
          <div class="stat-sub">${d.total_items_sold || 0} items sold</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-icon">📊</div>
          <div class="stat-label">Weekly Profit</div>
          <div class="stat-value">₹${(w.thisWeek || 0).toFixed(0)}</div>
          <div class="stat-sub" style="color:${trendColor}">${trendIcon} ${Math.abs(w.trend)}% vs last week</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">🧾</div>
          <div class="stat-label">GST Collected</div>
          <div class="stat-value">₹${(d.total_gst || 0).toFixed(0)}</div>
          <div class="stat-sub">Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💵</div>
          <div class="stat-label">Cash Sales</div>
          <div class="stat-value">₹${(d.cash_sales || 0).toFixed(0)}</div>
          <div class="stat-sub">UPI: ₹${(d.upi_sales || 0).toFixed(0)} | Udhar: ₹${(d.credit_sales || 0).toFixed(0)}</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2" style="margin-bottom:20px;">
        <div class="card">
          <div class="card-header"><span class="card-title">📅 7-Day Sales Trend</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="salesChartCanvas"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">🗂️ Category Profit (30 days)</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="catChartCanvas"></canvas></div></div>
        </div>
      </div>

      <!-- Payment Split + Top Products -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">🏆 Today's Top Products</span></div>
          <div class="card-body">
            ${daily.data.topProducts.length === 0
              ? `<div class="empty-state"><div class="emoji">🛍️</div><p>No sales recorded today yet</p></div>`
              : `<table><thead><tr><th>Product</th><th>Qty</th><th>Profit</th></tr></thead><tbody>
                ${daily.data.topProducts.map(p => `
                  <tr><td>${p.product_name}</td><td>${p.qty}</td><td class="text-green">₹${parseFloat(p.profit).toFixed(0)}</td></tr>
                `).join('')}
              </tbody></table>`
            }
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">💳 Payment Mode Split</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${[
                { label: '💵 Cash', val: d.cash_sales || 0, color: 'var(--jade)' },
                { label: '📱 UPI', val: d.upi_sales || 0, color: 'var(--turmeric)' },
                { label: '📒 Udhar (Credit)', val: d.credit_sales || 0, color: 'var(--red-alert)' }
              ].map(item => {
                const total = (d.total_revenue || 1);
                const pct = total > 0 ? ((item.val / total) * 100).toFixed(0) : 0;
                return `<div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:13px;">${item.label}</span>
                    <span style="font-size:13px;font-weight:600;">₹${item.val.toFixed(0)} (${pct}%)</span>
                  </div>
                  <div style="background:var(--mist);height:8px;border-radius:4px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${item.color};border-radius:4px;transition:width 0.8s;"></div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render charts
    const weekDays = w.days || [];
    const labels = weekDays.map(d => {
      const dt = new Date(d.sale_date);
      return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    });

    if (salesChart) salesChart.destroy();
    salesChart = new Chart(document.getElementById('salesChartCanvas'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Revenue', data: weekDays.map(d => d.revenue || 0), backgroundColor: 'rgba(255,107,44,0.7)', borderRadius: 6 },
          { label: 'Profit', data: weekDays.map(d => d.profit || 0), backgroundColor: 'rgba(27,138,90,0.7)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: { y: { ticks: { callback: v => '₹' + v } } }
      }
    });

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(document.getElementById('catChartCanvas'), {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          data: cats.map(c => c.total_profit),
          backgroundColor: ['#FF6B2C','#1B8A5A','#F5A623','#3B82F6','#8B5CF6','#EC4899'],
          borderWidth: 2, borderColor: '#fff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });

  } catch (err) {
    el.innerHTML = `<div class="alert alert-danger">⚠️ Could not load dashboard: ${err.message}</div>`;
  }
}
