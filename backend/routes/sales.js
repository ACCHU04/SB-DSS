// routes/sales.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  try {
    const { from, to } = req.query;
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const p = [];
    if (from) { sql += ' AND sale_date >= ?'; p.push(from); }
    if (to) { sql += ' AND sale_date <= ?'; p.push(to); }
    sql += ' ORDER BY sale_date DESC, id DESC LIMIT 100';
    res.json({ success: true, data: db.all(sql, p) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { product_id, quantity_sold, payment_mode, sale_date } = req.body;
    if (!product_id || !quantity_sold) return res.status(400).json({ success: false, error: 'product_id and quantity_sold required' });
    const product = db.get('SELECT * FROM products WHERE id=?', [product_id]);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    if (product.current_stock < quantity_sold) return res.status(400).json({ success: false, error: `Insufficient stock. Available: ${product.current_stock}` });

    const gst_amount = parseFloat((product.sell_price * quantity_sold * product.gst_percent / 100).toFixed(2));
    const sd = sale_date || new Date().toISOString().split('T')[0];
    const id = db.runAndGetId(
      'INSERT INTO sales (product_id,product_name,quantity_sold,sell_price,buy_price,gst_amount,payment_mode,sale_date) VALUES (?,?,?,?,?,?,?,?)',
      [product_id, product.name, quantity_sold, product.sell_price, product.buy_price, gst_amount, payment_mode||'cash', sd]
    );
    db.run('UPDATE products SET current_stock = MAX(0, current_stock - ?) WHERE id=?', [quantity_sold, product_id]);
    res.status(201).json({ success: true, data: db.get('SELECT * FROM sales WHERE id=?', [id]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary/daily', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const sales = db.all('SELECT * FROM sales WHERE sale_date=?', [date]);

    let total_transactions = sales.length, total_items_sold = 0, total_revenue = 0,
        total_cost = 0, total_profit = 0, total_gst = 0,
        cash_sales = 0, upi_sales = 0, credit_sales = 0;

    sales.forEach(s => {
      total_items_sold += s.quantity_sold;
      total_revenue += s.quantity_sold * s.sell_price;
      total_cost += s.quantity_sold * s.buy_price;
      total_profit += s.quantity_sold * (s.sell_price - s.buy_price);
      total_gst += parseFloat(s.gst_amount || 0);
      const amt = s.quantity_sold * s.sell_price;
      if (s.payment_mode === 'cash') cash_sales += amt;
      else if (s.payment_mode === 'upi') upi_sales += amt;
      else if (s.payment_mode === 'credit') credit_sales += amt;
    });

    // top products
    const topMap = {};
    sales.forEach(s => {
      if (!topMap[s.product_name]) topMap[s.product_name] = { product_name: s.product_name, qty: 0, profit: 0 };
      topMap[s.product_name].qty += s.quantity_sold;
      topMap[s.product_name].profit += s.quantity_sold * (s.sell_price - s.buy_price);
    });
    const topProducts = Object.values(topMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    res.json({ success: true, data: { date, summary: { total_transactions, total_items_sold, total_revenue, total_cost, total_profit, total_gst, cash_sales, upi_sales, credit_sales }, topProducts } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/summary/weekly', (req, res) => {
  try {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const sales = db.all('SELECT * FROM sales WHERE sale_date=?', [ds]);
      let revenue = 0, profit = 0, items_sold = 0;
      sales.forEach(s => { revenue += s.quantity_sold * s.sell_price; profit += s.quantity_sold * (s.sell_price - s.buy_price); items_sold += s.quantity_sold; });
      days.push({ sale_date: ds, revenue, profit, items_sold });
    }

    const thisWeekSales = db.all("SELECT * FROM sales WHERE sale_date >= date('now', '-6 days')");
    const lastWeekSales = db.all("SELECT * FROM sales WHERE sale_date >= date('now', '-13 days') AND sale_date < date('now', '-6 days')");

    const thisWeek = thisWeekSales.reduce((a, s) => a + s.quantity_sold * (s.sell_price - s.buy_price), 0);
    const lastWeek = lastWeekSales.reduce((a, s) => a + s.quantity_sold * (s.sell_price - s.buy_price), 0);
    const trend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : 0;

    res.json({ success: true, data: { days, thisWeek, lastWeek, trend } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/analysis/performance', (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
    const fromDate = weekAgo.toISOString().split('T')[0];
    const recentSales = db.all('SELECT * FROM sales WHERE sale_date >= ?', [fromDate]);

    const result = products.map(p => {
      const pSales = recentSales.filter(s => s.product_id == p.id);
      const weekly_sales = pSales.reduce((a, s) => a + s.quantity_sold, 0);
      const weekly_profit = pSales.reduce((a, s) => a + s.quantity_sold * (s.sell_price - s.buy_price), 0);
      const avg_daily_sales = weekly_sales / 7;
      const daysUntilStockout = avg_daily_sales > 0 ? Math.floor(p.current_stock / avg_daily_sales) : 999;

      let performanceCategory, suggestedAction, badge;
      if (weekly_sales >= 50) { performanceCategory = 'Fast-Moving'; suggestedAction = 'BUY NOW'; badge = '🚀'; }
      else if (weekly_sales >= 20) { performanceCategory = 'Medium-Moving'; suggestedAction = 'MONITOR'; badge = '📊'; }
      else if (weekly_sales >= 5) { performanceCategory = 'Slow-Moving'; suggestedAction = 'REDUCE ORDER'; badge = '🐢'; }
      else { performanceCategory = 'Very Slow'; suggestedAction = 'STOP ORDERING'; badge = '🛑'; }

      return { ...p, weekly_sales, weekly_profit, avg_daily_sales: avg_daily_sales.toFixed(1), daysUntilStockout, performanceCategory, suggestedAction, badge };
    });

    res.json({ success: true, data: result.sort((a, b) => b.weekly_sales - a.weekly_sales) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/analysis/categories', (req, res) => {
  try {
    const products = db.all('SELECT * FROM products');
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 29);
    const sales = db.all('SELECT * FROM sales WHERE sale_date >= ?', [monthAgo.toISOString().split('T')[0]]);

    const catMap = {};
    products.forEach(p => {
      if (!catMap[p.category]) catMap[p.category] = { category: p.category, product_count: 0, total_sold: 0, total_profit: 0 };
      catMap[p.category].product_count++;
    });
    sales.forEach(s => {
      const p = products.find(x => x.id == s.product_id);
      if (p && catMap[p.category]) {
        catMap[p.category].total_sold += s.quantity_sold;
        catMap[p.category].total_profit += s.quantity_sold * (s.sell_price - s.buy_price);
      }
    });

    res.json({ success: true, data: Object.values(catMap).sort((a, b) => b.total_profit - a.total_profit) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
