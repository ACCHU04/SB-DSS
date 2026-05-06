// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
  try { res.json({ success: true, data: db.all('SELECT * FROM products ORDER BY category, name') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/inventory/status', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    const products = db.all('SELECT * FROM products ORDER BY current_stock ASC');
    const result = products.map(p => {
      let stockStatus = 'OK', stockAlert = '';
      if (p.current_stock == 0) { stockStatus = 'OUT'; stockAlert = '❌ Out of Stock'; }
      else if (p.current_stock <= p.reorder_level) { stockStatus = 'LOW'; stockAlert = '⚠️ Low Stock'; }
      let expiryAlert = '';
      if (p.expiry_date) {
        if (p.expiry_date <= today) expiryAlert = '🔴 EXPIRED';
        else if (p.expiry_date <= in30) expiryAlert = '⚠️ Expiring Soon';
      }
      return { ...p, stockStatus, stockAlert, expiryAlert };
    });
    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const p = db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, category, buy_price, sell_price, opening_stock, reorder_level, supplier_name, gst_percent, expiry_date, unit } = req.body;
    if (!name || !category || !buy_price || !sell_price) return res.status(400).json({ success: false, error: 'Required fields missing' });
    const id = db.runAndGetId(
      'INSERT INTO products (name,category,buy_price,sell_price,opening_stock,current_stock,reorder_level,supplier_name,gst_percent,expiry_date,unit) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [name, category, buy_price, sell_price, opening_stock||0, opening_stock||0, reorder_level||10, supplier_name||'', gst_percent||5, expiry_date||null, unit||'pcs']
    );
    res.status(201).json({ success: true, data: db.get('SELECT * FROM products WHERE id=?', [id]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, category, buy_price, sell_price, reorder_level, supplier_name, gst_percent, expiry_date, unit } = req.body;
    db.run('UPDATE products SET name=?,category=?,buy_price=?,sell_price=?,reorder_level=?,supplier_name=?,gst_percent=?,expiry_date=?,unit=? WHERE id=?',
      [name, category, buy_price, sell_price, reorder_level, supplier_name, gst_percent, expiry_date||null, unit, req.params.id]);
    res.json({ success: true, data: db.get('SELECT * FROM products WHERE id=?', [req.params.id]) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try { db.run('DELETE FROM products WHERE id=?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
