const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const session = require('express-session');

app.use(session({
  secret: 'abcde123456@', // change this to any secret string
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Mock database
let suppliers = [
  { id: 1, name: "ABC Electrical Co.", category: "Electrical", rating: 4.8, projects: 45, status: "Active", location: "New York, NY" },
  { id: 2, name: "Prime Plumbing Services", category: "Plumbing", rating: 4.9, projects: 62, status: "Active", location: "Los Angeles, CA" },
];

// Generate new ID
function getNextId() {
  return suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
}

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: 'root', // your password
  database: 'VITA'
});

db.connect(err => {
  if (err) console.log('DB connection error:', err);
  else console.log('Connected to MySQL');
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { userName: req.session.userName });
});

app.get('/about-us', (req, res) => {
  res.render('about', { userName: req.session.userName });
});
// GET form
app.get('/suppliers/new', (req, res) => {
  res.render('supplier/new'); // sends the form HTML
});


// GET /supplier
app.get('/supplier', (req, res) => {
  db.query('SELECT * FROM suppliers', (err, results) => {
    if (err) return res.send(err);
    res.render('supplier/supplier', { mockSuppliers: results, userName: req.session.userName });
  });
});

// Create supplier
app.post('/suppliers', (req, res) => {
  const { name, category, location, rating, projects, status } = req.body;
  db.query(
    'INSERT INTO suppliers (name, category, location, rating, projects, status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category, location, parseFloat(rating), parseInt(projects), status],
    (err, result) => {
      if (err) return res.send(err);
      db.query('SELECT * FROM suppliers WHERE id = ?', [result.insertId], (err2, rows) => {
        if (err2) return res.send(err2);
        res.render('supplier/row', { supplier: rows[0] });
      });
    }
  );
});

// Edit supplier form
app.get('/suppliers/:id/edit', (req, res) => {
  db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.send(err);
    res.render('supplier/edit', { supplier: rows[0] });
  });
});

// Update supplier
app.put('/suppliers/:id', (req, res) => {
  const { name, category, location, rating, projects, status } = req.body;
  db.query(
    'UPDATE suppliers SET name=?, category=?, location=?, rating=?, projects=?, status=? WHERE id=?',
    [name, category, location, parseFloat(rating), parseInt(projects), status, req.params.id],
    (err) => {
      if (err) return res.send(err);
      db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err2, rows) => {
        if (err2) return res.send(err2);
        res.render('supplier/row', { supplier: rows[0] });
      });
    }
  );
});

// Delete supplier
app.delete('/suppliers/:id', (req, res) => {
  db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send(''); // HTMX will remove row
  });
});

app.get('/suppliers/:id/performance/new', (req, res) => {
  db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.send(err);
    const supplier = rows[0];
    if (!supplier) return res.status(404).send('Supplier not found');
    res.render('performance/new', { supplier });
  });
});


app.post('/suppliers/:id/performance', (req, res) => {
  const { onTimeDelivery, quality, costEfficiency } = req.body;
  const supplierId = req.params.id;

  db.query('SELECT * FROM suppliers WHERE id = ?', [supplierId], (err, rows) => {
    if (err) return res.send(err);
    if (!rows.length) return res.status(404).send('Supplier not found');

    db.query(
      `INSERT INTO supplier_performance (supplier_id, on_time_delivery, quality, cost_efficiency)
       VALUES (?, ?, ?, ?)`,
      [supplierId, onTimeDelivery, quality, costEfficiency],
      (err2) => {
        if (err2) return res.send(err2);
        res.send(`<div>
                    <p>Performance metrics saved successfully!</p>
                    <button class="btn btn-ghost" onclick="document.getElementById('modal').style.display='none';">Close</button>
                  </div>`);
      }
    );
  });
});


app.get('/performance', (req, res) => {
  db.query(
    `SELECT s.id, s.name, sp.on_time_delivery AS onTime, sp.quality, sp.cost_efficiency AS costScore
     FROM suppliers s
     LEFT JOIN supplier_performance sp ON s.id = sp.supplier_id
     ORDER BY s.name`,
    (err, results) => {
      if (err) return res.status(500).send(err);


      results.forEach(s => {
        if (s.onTime > 95) s.trend = 'up';
        else if (s.onTime < 90) s.trend = 'down';
        else s.trend = 'stable';
      });

      res.render('performance/performance', { suppliers: results, userName: req.session.userName });
    }
  );
});

// Orders tracking page
app.get('/orders', (req, res) => {
  db.query(
    'SELECT * FROM orders ORDER BY order_date DESC',
    (err, results) => {
      if (err) return res.status(500).send(err);

      res.render('orders/orders', {
        orders: results,
        userName: req.session.userName
      });
    }
  );
});


// Orders search & filter (HTMX)
app.get('/orders/search', (req, res) => {
  const { keyword, status } = req.query;

  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (keyword) {
    sql += ' AND (order_number LIKE ? OR supplier_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY order_date DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send(err);

    // HTMX partial render
    res.render('orders/order-table', { orders: results });
  });
});


// --- Inventory Page ---
app.get('/inventory', (req, res) => {
  const search = req.query.search || '';
  const category = req.query.category || '';

  let sql = 'SELECT * FROM inventory WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    // HTMX partial
    if (req.headers['hx-request']) {
      return res.render('inventory/inventory-cards', { products: results });
    }

    res.render('inventory/inventory', { products: results, search, category, userName: req.session.userName });
  });
});

app.get('/compliance', (req, res) => {
  db.query(
    'SELECT * FROM compliance_records ORDER BY expiry_date ASC',
    (err, results) => {
      if (err) return res.status(500).send(err);

      res.render('compliance/compliance', {
        records: results,
        userName: req.session.userName
      });
    }
  );
});

app.get('/compliance/search', (req, res) => {
  const { keyword, type, status } = req.query;

  let sql = 'SELECT * FROM compliance_records WHERE 1=1';
  const params = [];

  if (keyword) {
    sql += ' AND supplier_name LIKE ?';
    params.push(`%${keyword}%`);
  }

  if (type) {
    sql += ' AND compliance_type = ?';
    params.push(type);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY expiry_date ASC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).send(err);
    res.render('compliance/compliance-table', { records: results });
  });
});



// Register page
app.get('/register', (req, res) => res.render('register'));
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, result) => {
    if (err) {
      console.log(err);
      res.send('Error registering user');
    } else {
      res.redirect('/login');
    }
  });
});

// Login page
app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) return res.send('Error logging in');
      if (results.length > 0) {
        const user = results[0];
        // Store user info in session
        req.session.userId = user.id;
        req.session.userName = user.name;
        res.redirect('/'); // redirect to home
      } else {
        res.send('Invalid credentials');
      }
    }
  );
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
