// routes/extras.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ===== CREDITS =====
router.get('/credits', (req, res) => {
  try {
    const credits = db.all('SELECT * FROM credits ORDER BY status, credit_date DESC');
    const all = db.all('SELECT * FROM credits');
    const total_given = all.reduce((a,c)=>a+c.amount,0);
    const total_received = all.reduce((a,c)=>a+c.amount_paid,0);
    const total_pending = total_given - total_received;
    res.json({ success:true, data:credits, totals:{total_given, total_received, total_pending} });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/credits', (req, res) => {
  try {
    const { customer_name, product_name, amount, due_date, notes } = req.body;
    if (!customer_name || !amount) return res.status(400).json({success:false,error:'customer_name and amount required'});
    const id = db.runAndGetId('INSERT INTO credits (customer_name,product_name,amount,due_date,notes) VALUES (?,?,?,?,?)', [customer_name, product_name, amount, due_date||null, notes]);
    res.status(201).json({ success:true, data:db.get('SELECT * FROM credits WHERE id=?',[id]) });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.put('/credits/:id/pay', (req, res) => {
  try {
    const credit = db.get('SELECT * FROM credits WHERE id=?',[req.params.id]);
    if (!credit) return res.status(404).json({success:false,error:'Not found'});
    const newPaid = parseFloat(credit.amount_paid) + parseFloat(req.body.amount_paid);
    const status = newPaid >= credit.amount ? 'paid' : 'partial';
    db.run('UPDATE credits SET amount_paid=?,status=? WHERE id=?',[newPaid, status, req.params.id]);
    res.json({ success:true, data:db.get('SELECT * FROM credits WHERE id=?',[req.params.id]) });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== SUPPLIERS =====
router.get('/suppliers', (req, res) => {
  try { res.json({success:true,data:db.all('SELECT * FROM suppliers ORDER BY name')}); }
  catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/suppliers', (req, res) => {
  try {
    const { name, phone, products_supplied, avg_delivery_days, notes } = req.body;
    if (!name) return res.status(400).json({success:false,error:'Name required'});
    const id = db.runAndGetId('INSERT INTO suppliers (name,phone,products_supplied,avg_delivery_days,notes) VALUES (?,?,?,?,?)',[name,phone,products_supplied,avg_delivery_days||2,notes]);
    res.status(201).json({success:true,data:db.get('SELECT * FROM suppliers WHERE id=?',[id])});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== WASTAGE =====
router.get('/wastage', (req, res) => {
  try {
    const data = db.all('SELECT * FROM wastage ORDER BY damage_date DESC');
    const total_loss = data.reduce((a,w)=>a+parseFloat(w.estimated_loss||0),0);
    res.json({success:true,data,total_loss});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/wastage', (req, res) => {
  try {
    const { product_id, product_name, quantity_damaged, reason, damage_date } = req.body;
    if (!product_name || !quantity_damaged) return res.status(400).json({success:false,error:'product_name and quantity required'});
    let estimated_loss = 0;
    if (product_id) {
      const p = db.get('SELECT buy_price FROM products WHERE id=?',[product_id]);
      if (p) {
        estimated_loss = p.buy_price * quantity_damaged;
        db.run('UPDATE products SET current_stock=MAX(0,current_stock-?) WHERE id=?',[quantity_damaged,product_id]);
      }
    }
    const id = db.runAndGetId('INSERT INTO wastage (product_id,product_name,quantity_damaged,reason,estimated_loss,damage_date) VALUES (?,?,?,?,?,?)',[product_id||null,product_name,quantity_damaged,reason,estimated_loss,damage_date||new Date().toISOString().split('T')[0]]);
    res.status(201).json({success:true,data:db.get('SELECT * FROM wastage WHERE id=?',[id])});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== CUSTOMER REQUESTS =====
router.get('/requests', (req, res) => {
  try { res.json({success:true,data:db.all('SELECT * FROM customer_requests ORDER BY times_requested DESC')}); }
  catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/requests', (req, res) => {
  try {
    const { product_name, notes } = req.body;
    if (!product_name) return res.status(400).json({success:false,error:'product_name required'});
    const existing = db.get('SELECT * FROM customer_requests WHERE product_name=?',[product_name]);
    if (existing) {
      db.run('UPDATE customer_requests SET times_requested=times_requested+1 WHERE id=?',[existing.id]);
      return res.json({success:true,data:db.get('SELECT * FROM customer_requests WHERE id=?',[existing.id])});
    }
    const id = db.runAndGetId('INSERT INTO customer_requests (product_name,notes) VALUES (?,?)',[product_name,notes]);
    res.status(201).json({success:true,data:db.get('SELECT * FROM customer_requests WHERE id=?',[id])});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== COMPETITOR PRICES =====
router.get('/competitors', (req, res) => {
  try { res.json({success:true,data:db.all('SELECT * FROM competitor_prices ORDER BY recorded_date DESC')}); }
  catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/competitors', (req, res) => {
  try {
    const { product_id, product_name, our_price, competitor_price, competitor_name } = req.body;
    if (!product_name || !our_price || !competitor_price) return res.status(400).json({success:false,error:'Required fields missing'});
    const id = db.runAndGetId('INSERT INTO competitor_prices (product_id,product_name,our_price,competitor_price,competitor_name) VALUES (?,?,?,?,?)',[product_id||null,product_name,our_price,competitor_price,competitor_name]);
    res.status(201).json({success:true,data:db.get('SELECT * FROM competitor_prices WHERE id=?',[id])});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== SEASONAL =====
router.get('/seasonal', (req, res) => {
  try { res.json({success:true,data:db.all('SELECT * FROM seasonal_planner ORDER BY id')}); }
  catch(e){ res.status(500).json({success:false,error:e.message}); }
});

// ===== PURCHASES =====
router.get('/purchases', (req, res) => {
  try { res.json({success:true,data:db.all('SELECT * FROM purchases ORDER BY purchase_date DESC')}); }
  catch(e){ res.status(500).json({success:false,error:e.message}); }
});

router.post('/purchases', (req, res) => {
  try {
    const { product_id, quantity_purchased, buy_price, supplier_name, purchase_date } = req.body;
    if (!product_id || !quantity_purchased) return res.status(400).json({success:false,error:'product_id and quantity required'});
    const product = db.get('SELECT * FROM products WHERE id=?',[product_id]);
    if (!product) return res.status(404).json({success:false,error:'Product not found'});
    const pd = purchase_date || new Date().toISOString().split('T')[0];
    const id = db.runAndGetId('INSERT INTO purchases (product_id,product_name,quantity_purchased,buy_price,supplier_name,purchase_date) VALUES (?,?,?,?,?,?)',[product_id,product.name,quantity_purchased,buy_price||product.buy_price,supplier_name,pd]);
    db.run('UPDATE products SET current_stock=current_stock+? WHERE id=?',[quantity_purchased,product_id]);
    res.status(201).json({success:true,data:db.get('SELECT * FROM purchases WHERE id=?',[id])});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});

module.exports = router;
