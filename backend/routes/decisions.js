// routes/decisions.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/engine', (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const recentSales = db.all('SELECT * FROM sales WHERE sale_date >= ?', [weekAgo.toISOString().split('T')[0]]);
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];

    const decisions = products.map(p => {
      const pSales = recentSales.filter(s => s.product_id == p.id);
      const weekly_sales = pSales.reduce((a, s) => a + s.quantity_sold, 0);
      const weekly_profit = pSales.reduce((a, s) => a + s.quantity_sold * (s.sell_price - s.buy_price), 0);
      const avg_daily = weekly_sales / 7;
      const days_left = avg_daily > 0 ? Math.floor(p.current_stock / avg_daily) : 99;

      let decision, reason, priority, color;
      if (p.current_stock == 0) { decision='BUY NOW'; reason='Out of stock immediately'; priority=1; color='#e74c3c'; }
      else if (days_left <= 2 && weekly_sales > 10) { decision='BUY NOW'; reason=`Will run out in ${days_left} day(s)`; priority=1; color='#e74c3c'; }
      else if (p.current_stock <= p.reorder_level && weekly_sales >= 5) { decision='ORDER SOON'; reason='Stock below reorder level'; priority=2; color='#e67e22'; }
      else if (weekly_sales === 0 && p.current_stock > 0) { decision='STOP ORDERING'; reason='No sales in last 7 days'; priority=4; color='#7f8c8d'; }
      else if (weekly_sales < 5 && p.current_stock > 30) { decision='REDUCE ORDER'; reason='Slow moving, excess stock'; priority=4; color='#95a5a6'; }
      else if (weekly_sales === 0) { decision='TRY SMALL QTY'; reason='New/untested product'; priority=3; color='#3498db'; }
      else { decision='WAIT'; reason='Stock adequate for now'; priority=3; color='#27ae60'; }

      let expiryWarning = null;
      if (p.expiry_date) {
        if (p.expiry_date <= today) expiryWarning = 'EXPIRED — Remove immediately';
        else if (p.expiry_date <= in30) expiryWarning = 'Expiring within 30 days — Sell fast';
      }

      const profit_margin = p.sell_price > 0 ? (((p.sell_price - p.buy_price) / p.sell_price) * 100).toFixed(1) : 0;

      return { id:p.id, name:p.name, category:p.category, current_stock:p.current_stock,
               reorder_level:p.reorder_level, weekly_sales, daily_sales:avg_daily.toFixed(1),
               days_left: days_left===99?'—':days_left, decision, reason, priority, color,
               profit_margin, weekly_profit:weekly_profit.toFixed(2), expiryWarning };
    });

    decisions.sort((a, b) => a.priority - b.priority);
    res.json({ success: true, data: decisions });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/health-score', (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    const total = products.length;
    if (total === 0) return res.json({ success: true, data: { overallScore: 0, status: '🔴 No Data', statusColor:'#e74c3c', advice:'Add products to get started.', details:[] } });

    const adequate = products.filter(p => p.current_stock > p.reorder_level).length;
    const stockScore = Math.round((adequate / total) * 10);

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-6);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate()-13);
    const thisWeekSales = db.all('SELECT * FROM sales WHERE sale_date >= ?', [weekAgo.toISOString().split('T')[0]]);
    const lastWeekSales = db.all('SELECT * FROM sales WHERE sale_date >= ? AND sale_date < ?', [twoWeeksAgo.toISOString().split('T')[0], weekAgo.toISOString().split('T')[0]]);

    const thisProfit = thisWeekSales.reduce((a,s)=>a+s.quantity_sold*(s.sell_price-s.buy_price),0);
    const lastProfit = lastWeekSales.reduce((a,s)=>a+s.quantity_sold*(s.sell_price-s.buy_price),0);
    let profitScore = 5;
    if (lastProfit > 0) profitScore = Math.min(10, Math.max(0, Math.round(5 + ((thisProfit-lastProfit)/lastProfit)*5)));
    else if (thisProfit > 0) profitScore = 7;

    const salesMap = {};
    thisWeekSales.forEach(s => { salesMap[s.product_id] = (salesMap[s.product_id]||0) + s.quantity_sold; });
    const fastMoving = Object.values(salesMap).filter(v => v >= 20).length;
    const demandScore = Math.min(10, Math.round((fastMoving / Math.max(total, 1)) * 20));

    const overallScore = Math.round((stockScore + profitScore + demandScore) / 3);

    let status, statusColor, advice;
    if (overallScore >= 7) { status='🟢 Business is Healthy'; statusColor='#27ae60'; advice='Keep it up! Focus on growing fast-moving items.'; }
    else if (overallScore >= 4) { status='🟡 Needs Attention'; statusColor='#f39c12'; advice='Review slow-moving items and restock where needed.'; }
    else { status='🔴 Take Immediate Action'; statusColor='#e74c3c'; advice='Critical issues detected. Check inventory and sales urgently.'; }

    res.json({ success: true, data: {
      overallScore, status, statusColor, advice,
      details: [
        { name:'Stock Health', score:stockScore, max:10, desc:`${adequate}/${total} products well-stocked` },
        { name:'Profit Health', score:profitScore, max:10, desc:`₹${thisProfit.toFixed(0)} this week vs ₹${lastProfit.toFixed(0)} last week` },
        { name:'Demand Health', score:demandScore, max:10, desc:`${fastMoving} fast-moving products` },
      ]
    }});
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
