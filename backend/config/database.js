// config/database.js — SQLite via sql.js (pure JavaScript, no native build needed)
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../sb_dss.db');

let db = null;
let SQL = null;

async function initSQL() {
  if (SQL) return;
  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();
}

function getDb() {
  if (db) return db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  getDb().run(sql, params);
  saveDb();
}

function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function runAndGetId(sql, params = []) {
  getDb().run(sql, params);
  const r = getDb().exec('SELECT last_insert_rowid() as id');
  saveDb();
  return r[0]?.values[0][0];
}

function exec(sql) {
  getDb().exec(sql);
  saveDb();
}

async function initTables() {
  await initSQL();
  getDb();

  exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, category TEXT NOT NULL,
      buy_price REAL NOT NULL, sell_price REAL NOT NULL,
      opening_stock INTEGER DEFAULT 0, current_stock INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10, supplier_name TEXT,
      gst_percent REAL DEFAULT 5, expiry_date TEXT, unit TEXT DEFAULT 'pcs',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, product_name TEXT, quantity_sold INTEGER,
      sell_price REAL, buy_price REAL, gst_amount REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'cash', sale_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, product_name TEXT, quantity_purchased INTEGER,
      buy_price REAL, supplier_name TEXT, purchase_date TEXT DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT, product_name TEXT, amount REAL,
      amount_paid REAL DEFAULT 0, status TEXT DEFAULT 'pending',
      credit_date TEXT DEFAULT (date('now')), due_date TEXT, notes TEXT
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, phone TEXT, products_supplied TEXT,
      avg_delivery_days INTEGER DEFAULT 2, last_order_date TEXT, notes TEXT
    );
    CREATE TABLE IF NOT EXISTS customer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT, times_requested INTEGER DEFAULT 1,
      currently_stocked INTEGER DEFAULT 0,
      request_date TEXT DEFAULT (date('now')), notes TEXT
    );
    CREATE TABLE IF NOT EXISTS competitor_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, product_name TEXT,
      our_price REAL, competitor_price REAL,
      competitor_name TEXT, recorded_date TEXT DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS wastage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER, product_name TEXT, quantity_damaged INTEGER,
      reason TEXT, estimated_loss REAL DEFAULT 0,
      damage_date TEXT DEFAULT (date('now'))
    );
    CREATE TABLE IF NOT EXISTS seasonal_planner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT, event_month TEXT, products_to_stock TEXT,
      expected_demand TEXT DEFAULT 'High', notes TEXT
    );
  `);

  const sc = get('SELECT COUNT(*) as c FROM seasonal_planner');
  if (!sc || sc.c == 0) {
    const events = [
      ['Diwali','October-November','Sweets, Dry Fruits, Diyas, Candles, Gift Packs','Very High'],
      ['Holi','March','Colors, Cold Drinks, Snacks, Sweets','High'],
      ['Summer Season','April-June','Cold Drinks, Ice Cream, ORS Packets, Lemonade','Very High'],
      ['School Reopening','June','Stationery, Notebooks, Biscuits, Pens','High'],
      ['Monsoon','July-September','Umbrellas, Namkeen, Tea, Instant Noodles','Medium-High'],
      ['Eid / Ramadan','Variable','Dates, Sweets, Sewai, Beverages, Fruit','High'],
      ['Pongal / Sankranti','January','Rice, Jaggery, Sugarcane, Sweets','High'],
      ['Christmas / New Year','December','Cakes, Chocolates, Cold Drinks, Chips','Medium'],
    ];
    events.forEach(([en,em,ps,ed]) => run('INSERT INTO seasonal_planner (event_name,event_month,products_to_stock,expected_demand) VALUES (?,?,?,?)',[en,em,ps,ed]));
  }

  const pc = get('SELECT COUNT(*) as c FROM products');
  if (!pc || pc.c == 0) {
    const prods = [
      ['Parle-G Biscuit (10 pcs)','Snacks',5,7,200,45,30,'Parle Distributor',5,'pcs'],
      ['Maggi Noodles (12 pcs)','Snacks',10,14,100,62,20,'Nestle Distributor',12,'pcs'],
      ['Tata Salt (1 kg)','Grocery',20,24,80,8,15,'Tata Distributor',0,'kg'],
      ['Sunflower Oil (1 L)','Grocery',105,115,50,22,10,'Fortune Distributor',5,'L'],
      ['Dairy Milk Chocolate','Confectionery',20,25,60,3,15,'Cadbury Rep',18,'pcs'],
      ['Lays Chips (Rs.10)','Snacks',7,10,150,85,40,'PepsiCo Distributor',12,'pcs'],
      ['Lifebuoy Soap (100g)','Personal Care',25,32,40,12,10,'HUL Distributor',18,'pcs'],
      ['Colgate (100g)','Personal Care',55,65,30,18,8,'Colgate Rep',18,'pcs'],
    ];
    prods.forEach(([name,cat,buy,sell,os,cs,rl,sup,gst,unit]) =>
      run('INSERT INTO products (name,category,buy_price,sell_price,opening_stock,current_stock,reorder_level,supplier_name,gst_percent,unit) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [name,cat,buy,sell,os,cs,rl,sup,gst,unit]));

    // Seed 7 days of demo sales
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      [[1,'Parle-G Biscuit (10 pcs)',Math.floor(10+Math.random()*12),7,5,5*0.05,'cash'],
       [2,'Maggi Noodles (12 pcs)',Math.floor(5+Math.random()*8),14,10,14*0.12,'upi'],
       [6,'Lays Chips (Rs.10)',Math.floor(8+Math.random()*10),10,7,10*0.12,'cash'],
       [3,'Tata Salt (1 kg)',Math.floor(2+Math.random()*4),24,20,0,'cash'],
      ].forEach(([pid,pname,qty,sp,bp,gst,pm]) =>
        run('INSERT INTO sales (product_id,product_name,quantity_sold,sell_price,buy_price,gst_amount,payment_mode,sale_date) VALUES (?,?,?,?,?,?,?,?)',
          [pid,pname,qty,sp,bp,parseFloat((gst*qty).toFixed(2)),pm,ds]));
    }
  }

  console.log('✅ SB-DSS Database ready');
}

module.exports = { run, all, get, exec, runAndGetId, initTables };
