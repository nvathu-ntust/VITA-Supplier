const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Route
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/supplier', (req, res) => {
  res.render('supplier');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});