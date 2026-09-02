# API Top-Up Digital Products

Backend REST API untuk sistem Top-Up Produk Digital sederhana menggunakan Golang native (`net/http`) dan PostgreSQL dengan arsitektur SQL Transaction yang aman dari *concurrency race condition*.

---

## 📁 Struktur Folder

```text
api-topup/
├── backend/
│   ├── .env.example
│   ├── config/
│   │   └── database.go       # Koneksi PostgreSQL & auto-migration
│   ├── handlers/
│   │   ├── order_handler.go  # Handler transaksi order (SQL Tx & row lock)
│   │   └── user_handler.go   # Handler user (create, get detail, saldo)
│   ├── middleware/
│   │   └── cors.go           # CORS middleware (Vite/React support)
│   ├── models/
│   │   ├── order.go
│   │   ├── response.go
│   │   └── user.go
│   ├── routes/
│   │   └── routes.go         # Endpoint routing
│   ├── utils/
│   │   └── response.go
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   ├── main_test.go
│   └── schema.sql
└── README.md
```

---

## 🚀 Cara Menjalankan Backend

1. Pindah ke direktori `backend/`:
   ```bash
   cd backend
   ```

2. Buat file `.env` berdasarkan `.env.example`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=topup_db
   DB_SSLMODE=disable
   ```

3. Jalankan unit test:
   ```bash
   go test -v ./...
   ```

4. Jalankan server:
   ```bash
   go run .
   ```
   *Database dan tabel akan otomatis di-create saat server pertama kali dijalankan.*

---

## 📌 Endpoint API

- `POST /users` / `POST /users/register` — Buat user baru
- `GET /users?id={id}` / `GET /users/{id}` — Cek detail & saldo user
- `POST /users/saldo` — Top-up / tambah saldo user
- `POST /orders` — Buat order top-up (Atomic SQL Transaction)
- `GET /orders` — List semua order
- `GET /orders?user_id={id}` — List order per user
