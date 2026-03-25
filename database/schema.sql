-- Fleet Management System - Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS fleet_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleet_management;

-- Users table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'driver') NOT NULL DEFAULT 'driver',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS Vehicles (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type ENUM('bus', 'car', 'van', 'truck') NOT NULL,
  registration_number VARCHAR(20) NOT NULL UNIQUE,
  model VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  fuel_type ENUM('diesel', 'petrol', 'electric', 'hybrid') NOT NULL,
  purchase_date DATE,
  status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_type (vehicle_type)
);

-- Driver Profiles
CREATE TABLE IF NOT EXISTS DriverProfiles (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  license_number VARCHAR(50) NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  date_joined DATE NOT NULL,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Vehicle Assignments
CREATE TABLE IF NOT EXISTS VehicleAssignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES DriverProfiles(driver_id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_is_active (is_active),
  -- Only one active assignment per vehicle
  CONSTRAINT uq_active_vehicle UNIQUE KEY (vehicle_id, is_active)
);

-- Attendance
CREATE TABLE IF NOT EXISTS Attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  vehicle_id INT,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'leave', 'holiday') NOT NULL DEFAULT 'present',
  check_in_time TIME,
  check_out_time TIME,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES DriverProfiles(driver_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE SET NULL,
  INDEX idx_driver_id (driver_id),
  INDEX idx_date (date),
  INDEX idx_vehicle_id (vehicle_id),
  UNIQUE KEY uq_driver_date (driver_id, date)
);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS FuelLogs (
  fuel_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT,
  date DATE NOT NULL,
  fuel_quantity_liters DECIMAL(8,2) NOT NULL,
  fuel_cost DECIMAL(10,2) NOT NULL,
  odometer_reading INT,
  fuel_station VARCHAR(100),
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES DriverProfiles(driver_id) ON DELETE SET NULL,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_date (date)
);

-- Expenses
CREATE TABLE IF NOT EXISTS Expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT,
  category ENUM('fuel', 'maintenance', 'insurance', 'permit', 'tyres', 'other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  receipt_number VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_date (date),
  INDEX idx_category (category)
);

-- Maintenance Records
CREATE TABLE IF NOT EXISTS MaintenanceRecords (
  maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  notes TEXT,
  next_service_due DATE,
  odometer_at_service INT,
  service_provider VARCHAR(100),
  status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_service_date (service_date),
  INDEX idx_next_service (next_service_due)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS AuditLogs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity),
  INDEX idx_timestamp (timestamp)
);

-- Default Admin User (password: Admin@123)
INSERT INTO Users (name, email, password, role) VALUES
('System Admin', 'admin@fleetms.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHG', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Sample vehicles
INSERT INTO Vehicles (vehicle_type, registration_number, model, capacity, fuel_type, purchase_date, status) VALUES
('bus', 'TN01AB1234', 'Tata Starbus', 52, 'diesel', '2022-01-15', 'active'),
('bus', 'TN01AB5678', 'Ashok Leyland Viking', 45, 'diesel', '2021-06-10', 'active'),
('car', 'TN01CD9012', 'Toyota Innova', 7, 'diesel', '2023-03-20', 'active'),
('car', 'TN01CD3456', 'Maruti Swift', 5, 'petrol', '2022-11-05', 'active'),
('van', 'TN01EF7890', 'Force Traveller', 12, 'diesel', '2021-09-14', 'maintenance')
ON DUPLICATE KEY UPDATE vehicle_id=vehicle_id;
