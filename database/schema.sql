-- Create Database
CREATE DATABASE IF NOT EXISTS ufa_organization;
USE ufa_organization;

-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('member', 'admin', 'super_admin') DEFAULT 'member',
    phone VARCHAR(20),
    county VARCHAR(50),
    ward VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    membership_type ENUM('individual', 'organization') NOT NULL,
    organization_name VARCHAR(150),
    registration_number VARCHAR(50),
    status ENUM('pending', 'active', 'inactive', 'suspended') DEFAULT 'pending',
    membership_date DATE,
    expiry_date DATE,
    payment_status ENUM('paid', 'unpaid', 'waived') DEFAULT 'unpaid',
    profile_complete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events table
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(200),
    event_type ENUM('civic_education', 'advocacy', 'youth', 'women', 'general') NOT NULL,
    max_participants INT,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    subscription_status BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donations
CREATE TABLE donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(100),
    email VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents repository
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    document_type ENUM('constitution', 'policy', 'report', 'other') DEFAULT 'other',
    uploaded_by INT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_events_date ON events(event_date);

-- Insert default admin user (password: Admin@123)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('UFA Admin', 'admin@ufa.org', '$2b$10$YourHashedPasswordHere', 'super_admin');