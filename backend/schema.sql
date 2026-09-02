-- ============================================================
-- DDL SCHEMA: TOP-UP DIGITAL PRODUCT SYSTEM (PostgreSQL)
-- ============================================================

-- 0. Buat Database (Jika belum ada)
-- CREATE DATABASE topup_db;

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT '',
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) DEFAULT '',
    google_id VARCHAR(255) DEFAULT '',
    avatar_url VARCHAR(255) DEFAULT '',
    saldo BIGINT NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kolom tambahan jika tabel users sudah ada sebelumnya:
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT '';

-- 2. Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    harga BIGINT NOT NULL CHECK (harga > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel OTPs (Reset Password & Verifikasi)
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
