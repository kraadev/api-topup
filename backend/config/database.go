package config

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq" // Driver PostgreSQL
)

// DB adalah instance global koneksi database
var DB *sql.DB

// LoadEnv membaca file .env dan memasukkannya ke environment jika belum ada
func LoadEnv(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return // Jika file tidak ada, skip tanpa error
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)

			if os.Getenv(key) == "" {
				_ = os.Setenv(key, val)
			}
		}
	}
}

// InitDB menginisialisasi connection pool ke PostgreSQL dan auto-migrate tabel
func InitDB() (*sql.DB, error) {
	LoadEnv(".env")

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "topup_db")
	sslmode := getEnv("DB_SSLMODE", "disable")

	// 1. Pastikan database target sudah dibuat di server PostgreSQL
	if err := ensureDatabaseExists(host, port, user, password, dbname, sslmode); err != nil {
		log.Printf("⚠️ Catatan auto-create database: %v", err)
	}

	// 2. Hubungkan ke database target
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database '%s' tidak dapat dihubungi: %w", dbname, err)
	}

	log.Printf("✅ Berhasil terhubung ke database PostgreSQL ('%s')!\n", dbname)
	DB = db

	// 3. Auto-Migrate tabel users dan orders
	if err := AutoMigrate(db); err != nil {
		return nil, fmt.Errorf("gagal migrasi skema tabel: %w", err)
	}

	return db, nil
}

func ensureDatabaseExists(host, port, user, password, dbname, sslmode string) error {
	adminDSN := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		host, port, user, password, sslmode,
	)

	adminDB, err := sql.Open("postgres", adminDSN)
	if err != nil {
		return fmt.Errorf("gagal menghubungkan ke postgres server: %w", err)
	}
	defer adminDB.Close()

	if err := adminDB.Ping(); err != nil {
		return fmt.Errorf("gagal ping postgres server: %w", err)
	}

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1);`
	if err := adminDB.QueryRow(checkQuery, dbname).Scan(&exists); err != nil {
		return fmt.Errorf("gagal mengecek database: %w", err)
	}

	if !exists {
		createQuery := fmt.Sprintf(`CREATE DATABASE "%s";`, dbname)
		if _, err := adminDB.Exec(createQuery); err != nil {
			return fmt.Errorf("gagal membuat database '%s': %w", dbname, err)
		}
		log.Printf("✨ Database '%s' berhasil dibuat otomatis!\n", dbname)
	}

	return nil
}

func AutoMigrate(db *sql.DB) error {
	schemaQuery := `
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

	-- Tambahkan kolom jika belum ada (untuk database yang sudah berjalan sebelumnya)
	ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT '';
	ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
	ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '';
	ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT '';
	ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT '';

	CREATE TABLE IF NOT EXISTS orders (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		item VARCHAR(255) NOT NULL,
		harga BIGINT NOT NULL CHECK (harga > 0),
		status VARCHAR(50) NOT NULL DEFAULT 'Success',
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS otps (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) NOT NULL,
		otp_code VARCHAR(10) NOT NULL,
		expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
		used BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
	CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);

	-- Pastikan minimal ada 1 user default (ID #1)
	INSERT INTO users (id, username, name, email, saldo)
	VALUES (1, 'steaven', 'Steaven Galang', 'steavengalang@gmail.com', 0)
	ON CONFLICT (id) DO NOTHING;

	-- Sinkronkan sequence serial jika id=1 dimasukkan manual
	SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
	`

	_, err := db.Exec(schemaQuery)
	if err != nil {
		return err
	}

	log.Println("✅ Skema database & tabel (users, orders, otps) siap digunakan!")
	return nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
