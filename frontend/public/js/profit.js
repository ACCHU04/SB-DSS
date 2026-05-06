// js/profit.js
let profitChart = null;

async function renderProfit() {
  const el = document.getElementById('page-profit');
  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--slate);">Loading...</div>`;
  try {
    const [weekly, performance, categories] = await Promise.all([
      API.sales.weeklySummary(),
      API.sales.performance(),
      API.sales.categories()
    ]);
    const w = weekly.data;
    const perf = performance.data;
    const cats = categories.data;

    el.innerHTML = `
      <div class="section-header"><div class="section-title">💰 Profit & Loss Dashboard</div></div>
      <div class="stats-grid">
        <div class="stat-card green"><div class="stat-icon">💰</div><div class="stat-label">This Week Profit</div><div class="stat-value">₹${parseFloat(w.thisWeek||0).toFixed(0)}</div></div>
        <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-label">Last Week Profit</div><div class="stat-value">₹${parseFloat(w.lastWeek||0).toFixed(0)}</div></div>
        <div class="stat-card ${parseFloat(w.trend)>=0?'green':'red'}"><div class="stat-icon">${parseFloat(w.trend)>=0?'📈':'📉'}</div><div class="stat-label">Week Trend</div><div class="stat-value">${w.trend}%</div><div class="stat-sub">vs previous week</div></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">📈 Daily Profit Trend (7 Days)</span></div>
          <div class="card-body"><div class="chart-container"><canvas id="profitChartCanvas"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">🗂️ Category P&L (30 days)</span></div>
          <div class="card-body">
            <table>
              <thead><tr><th>Category</th><th>Products</th><th>Items Sold</th><th>Total Profit</th></tr></thead>
              <tbody>
                ${cats.map(c => `<tr>
                  <td><span class="badge badge-blue">${c.category}</span></td>
                  <td>${c.product_count}</td>
                  <td>${c.total_sold}</td>
                  <td class="text-green font-mono">₹${parseFloat(c.total_profit||0).toFixed(0)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">📦 Product-Level P&L (This Week)</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Buy ₹</th><th>Sell ₹</th><th>Margin %</th><th>Weekly Sales (qty)</th><th>Weekly Revenue</th><th>Weekly Profit</th></tr></thead>
            <tbody>
              ${perf.map(p => {
                const margin = p.sell_price > 0 ? (((p.sell_price-p.buy_price)/p.sell_price)*100).toFixed(0) : 0;
                const revenue = (p.weekly_sales * p.sell_price).toFixed(0);
                return `<tr>
                  <td><strong>${p.name}</strong></td>
                  <td>₹${p.buy_price}</td>
                  <td>₹${p.sell_price}</td>
                  <td><span class="badge ${margin>=20?'badge-green':margin>=10?'badge-gold':'badge-red'}">${margin}%</span></td>
                  <td>${p.weekly_sales}</td>
                  <td class="font-mono">₹${revenue}</td>
                  <td class="text-green font-mono">₹${parseFloat(p.weekly_profit||0).toFixed(0)}</td>
                </tr>`;
              }).join('')}
              <tr style="background:var(--smoke);font-weight:700;">
                <td colspan="5">TOTAL</td>
                <td class="font-mono">₹${perf.reduce((a,p)=>a+(p.weekly_sales*p.sell_price),0).toFixed(0)}</td>
                <td class="text-green font-mono">₹${perf.reduce((a,p)=>a+parseFloat(p.weekly_profit||0),0).toFixed(0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (profitChart) profitChart.destroy();
    profitChart = new Chart(document.getElementById('profitChartCanvas'), {
      type: 'line',
      data: {
        labels: w.days.map(d => new Date(d.sale_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})),
        datasets: [{
          label: 'Daily Profit (₹)',
          data: w.days.map(d => d.profit||0),
          borderColor: '#1B8A5A', backgroundColor: 'rgba(27,138,90,0.12)',
          tension: 0.4, fill: true, pointBackgroundColor: '#1B8A5A', pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => '₹'+v } } }
      }
    });
  } catch (err) {
    el.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}
