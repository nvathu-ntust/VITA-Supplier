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

CREATE TABLE compliance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(255) NOT NULL,
  compliance_type ENUM('Insurance','License','Safety') NOT NULL,
  document_name VARCHAR(255),
  status ENUM('Valid','Expiring','Expired') NOT NULL,
  expiry_date DATE NOT NULL,
  last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE compliance_records
ADD COLUMN document_path VARCHAR(255);



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

INSERT INTO compliance_records
(supplier_name, compliance_type, document_name, status, expiry_date)
VALUES
('ABC Electrical Co.', 'Insurance', 'General Liability', 'Valid', '2026-03-12'),
('Prime Plumbing Services', 'License', 'State Contractor License', 'Expiring', '2025-10-01'),
('ABC Electrical Co.', 'Safety', 'OSHA Safety Certificate', 'Expired', '2024-12-01'),
('Delta Steel Works', 'Insurance', 'Worker Compensation', 'Valid', '2026-01-18'),
('Prime Plumbing Services', 'Safety', 'Site Safety Training', 'Expiring', '2025-08-20');

