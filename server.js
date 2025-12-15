const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const multer = require("multer")
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const session = require('express-session');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/compliance");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

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
  if (!req.session.userId) {
    // nếu chưa login
    return res.render('index', {
      userName: null,
      subscription: 'manual',
      role: null
    });
  }

  db.query(
    'SELECT subscription, role FROM users WHERE id = ?',
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).send(err);

      const subscription = result?.[0]?.subscription || 'manual';
      const role = result?.[0]?.role || null;

      res.render('index', {
        userName: req.session.userName,
        subscription,
        role
      });
    }
  );
});


app.get('/about-us', (req, res) => {
  res.render('about', { userName: req.session.userName });
});

app.get('/career', (req, res) => {
  res.render('career/career', { userName: req.session.userName });
});

app.get('/contact', (req, res) => {
  res.render('contact/contact', { userName: req.session.userName });
});

app.post('/contact/submit', (req, res) => {
  const { name, email, message } = req.body;

  console.log("Contact form submitted:", { name, email, message });

  // Render success page
  res.render('contact/contact-success', { userName: req.session.userName });
});
// GET form
app.get('/suppliers/new', (req, res) => {
  res.render('supplier/new');
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
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  // Get current user info
  db.query(
    'SELECT id, role, name, subscription FROM users WHERE id = ?',
    [userId],
    (err, users) => {
      if (err) return res.status(500).send(err);
      if (!users.length) return res.redirect('/login');

      const { role, name: userName, subscription } = users[0];

      let sql = `
        SELECT 
          cr.id,
          cr.supplier_name,
          cr.compliance_type,
          cr.status,
          DATE_FORMAT(cr.expiry_date, '%Y-%m-%d') AS expiry_date,
          cr.document_name,
          cr.document_path,
          u.subscription AS supplier_subscription
        FROM compliance_records cr
        LEFT JOIN users u
          ON LOWER(u.name) = LOWER(cr.supplier_name)
      `;

      const params = [];

      // Supplier: only see own records
      if (role === 'supplier') {
        sql += ' WHERE LOWER(cr.supplier_name) = LOWER(?)';
        params.push(userName);
      }

      sql += ' ORDER BY cr.expiry_date ASC';

      db.query(sql, params, (err2, records) => {
        if (err2) return res.status(500).send(err2);

        // Is current supplier PRO?
        const isProSupplier =
          role === 'supplier' && subscription === 'pro';

        res.render('compliance/compliance', {
          records,
          role,
          userName,
          isProSupplier,
          uploaded: req.query.uploaded === '1'
        });
      });
    }
  );
});


app.post('/compliance/update/:id', (req, res) => {
  const userId = req.session.userId;
  const { status, expiry_date } = req.body; // expiry_date từ form là "YYYY-MM-DD"
  const { id } = req.params;

  // Lấy role và name để kiểm tra quyền
  db.query('SELECT role, name FROM users WHERE id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).send(err);
    if (!rows.length) return res.status(404).send('User not found');

    const { role, name } = rows[0];

    // Chỉ supplier mới được edit record của chính họ
    if (role !== 'supplier') return res.status(403).send('Forbidden');

    // Cập nhật record, không dùng new Date(), lưu trực tiếp string YYYY-MM-DD
    db.query(
      'UPDATE compliance_records SET status = ?, expiry_date = ? WHERE id = ? AND LOWER(supplier_name) = LOWER(?)',
      [status, expiry_date, id, name],
      (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0)
          return res.status(404).send('Record not found or not yours');

        // Redirect kèm query param để hiển thị thông báo
        res.redirect('/compliance?updated=1');
      }
    );
  });
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

app.post('/compliance/upload/:id', upload.single('document'), (req, res) => {
  const { id } = req.params;

  // Đường dẫn lưu file trong public
  const path = `uploads/${req.file.filename}`;

  db.query(
    'UPDATE compliance_records SET document_name = ?, document_path = ? WHERE id = ?',
    [req.file.originalname, path, id],
    err => {
      if (err) return res.status(500).send(err);
      res.redirect('/compliance?uploaded=1');
    }
  );
});





// Register page
app.get('/register', (req, res) => res.render('register'));

app.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send('Error registering user');
      }

      // Nếu role là supplier, thêm vào compliance_records
      if (role === 'supplier') {
        db.query(
          'INSERT INTO compliance_records (supplier_name, compliance_type, status, expiry_date) VALUES (?, ?, ?, ?)',
          [name, 'Insurance', 'Valid', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)], // expiry 1 năm sau
          err2 => {
            if (err2) console.log('Error adding to compliance_records:', err2);
            // redirect về login
            res.redirect('/login');
          }
        );
      } else {
        res.redirect('/login');
      }
    }
  );
});


app.get('/subscription', (req, res) => {
  const userName = req.session.userName;
  const role = req.session.role; // or fetch from DB

  res.render('subscription/subscription', {
    userName,
    role
  });
});

app.get('/subscription/pro', (req, res) => {
  res.render('subscription/pro-payment', {
    userName: req.session.userName
  });
});

app.post('/subscription/pro/pay', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  db.query(
    'UPDATE users SET subscription = ? WHERE id = ?',
    ['pro', userId],
    err => {
      if (err) return res.status(500).send(err);

      res.render('subscription/success', { userName: req.session.userName });
    }
  );
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
        req.session.role = user.role
        res.redirect('/'); // redirect to home
      } else {
        res.send('Invalid credentials');
      }
    }
  );
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
