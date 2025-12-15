CREATE DATABASE VITA;

USE VITA;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  rating DECIMAL(3,2),
  projects INT,
  status ENUM('Active','Pending') DEFAULT 'Active'
);

CREATE TABLE supplier_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  on_time_delivery FLOAT,
  quality FLOAT,
  cost_efficiency FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INT NOT NULL
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50),
  supplier_name VARCHAR(100),
  product_name VARCHAR(100),
  quantity INT,
  status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled'),
  order_date DATE,
  expected_delivery DATE
);

-- Insert mock data
INSERT INTO inventory (name, supplier, category, stock) VALUES
('Cement Bag', 'ABC Materials', 'Material', 50),
('Steel Rod', 'Steel Co', 'Material', 15),
('Excavator', 'HeavyMachinery Inc', 'Equipment', 2),
('Paint', 'Colors Ltd', 'Material', 0),
('Concrete Mixer', 'MixerPro', 'Equipment', 5),
('Sand', 'ABC Materials', 'Material', 100),
('Gravel', 'GravelCorp', 'Material', 40),
('Wheel Loader', 'HeavyMachinery Inc', 'Equipment', 1);
