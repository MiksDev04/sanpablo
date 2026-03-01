-- SA Mobile-based App Demographic Study and Data Gathering for Tourists
-- San Pablo City, Laguna - Database Schema
-- MySQL Compatible

-- Drop tables if exists (optional, for fresh setup)
-- DROP TABLE IF EXISTS messages;
-- DROP TABLE IF EXISTS monthly_submissions;
-- DROP TABLE IF EXISTS guest_records;
-- DROP TABLE IF EXISTS businesses;
-- DROP TABLE IF EXISTS users;

-- Users table (covers both business and admin)
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('business', 'admin') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role_status (role, status)
);

-- Businesses (accommodation establishments: hotels, resorts, inns)
CREATE TABLE businesses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  permit_number VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  permit_file_url VARCHAR(500),
  valid_id_url VARCHAR(500),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_permit (permit_number)
);

-- Guest records (demographic data per check-in)
CREATE TABLE guest_records (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'lgbt', 'prefer_not_to_say') NOT NULL,
  age ENUM('1-9', '10-17', '18-25', '26-35', '36-45', '46-55', '56+', 'prefer_not_to_say') NOT NULL,
  transportation_mode ENUM('private_car', 'bus', 'van', 'motorcycle', 'plane', 'other') NOT NULL,
  purpose ENUM('leisure', 'business', 'event', 'others') NOT NULL,
  number_of_guests INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_id (business_id),
  INDEX idx_check_in (check_in),
  INDEX idx_nationality (nationality),
  INDEX idx_business_checkin (business_id, check_in)
);

-- Monthly submissions (lock data after confirmation)
CREATE TABLE monthly_submissions (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  month TINYINT NOT NULL CHECK (month >= 1 AND month <= 12),
  year SMALLINT NOT NULL,
  status ENUM('submitted', 'not_submitted') NOT NULL DEFAULT 'not_submitted',
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_business_month_year (business_id, month, year),
  INDEX idx_month_year (month, year)
);

-- Messages (admin to business, reminders, announcements)
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_receiver (receiver_id),
  INDEX idx_sender (sender_id),
  INDEX idx_read_status (receiver_id, read_status)
);

-- Guest subgroups (optional: for granular demographic breakdown per record)
-- Use when one check-in has multiple subgroups (e.g., 3 male/American/12-18, 5 female/American/18-25)
CREATE TABLE guest_subgroups (
  id VARCHAR(36) PRIMARY KEY,
  guest_record_id VARCHAR(36) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'lgbt', 'prefer_not_to_say') NOT NULL,
  age ENUM('1-9', '10-17', '18-25', '26-35', '36-45', '46-55', '56+', 'prefer_not_to_say') NOT NULL,
  count INT NOT NULL DEFAULT 1,
  FOREIGN KEY (guest_record_id) REFERENCES guest_records(id) ON DELETE CASCADE,
  INDEX idx_guest_record (guest_record_id)
);
