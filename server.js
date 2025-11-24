const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
app.get('/', (req, res) => res.render('index'));
app.get('/supplier', (req, res) => res.render('supplier'));

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
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.send('Error logging in');
    if (results.length > 0) res.send(`Welcome ${results[0].name}! <a href="/">Go Home</a>`);
    else res.send('Invalid credentials');
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
