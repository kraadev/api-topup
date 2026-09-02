-- ============================================================
-- DDL SCHEMA: TOP-UP DIGITAL PRODUCT SYSTEM (PostgreSQL)
-- ============================================================

-- 0. Buat Database (Jika belum ada)
-- Jalankan baris ini secara terpisah jika via psql / GUI tool:
CREATE DATABASE topup_db;

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    saldo BIGINT NOT NULL DEFAULT 0 CHECK (saldo >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    harga BIGINT NOT NULL CHECK (harga > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk mempercepat query order berdasarkan user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
