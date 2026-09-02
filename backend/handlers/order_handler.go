package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"api-topup/models"
	"api-topup/utils"
)

// OrderHandler membungkus dependensi database untuk handler pesanan/transaksi
type OrderHandler struct {
	DB *sql.DB
}

// NewOrderHandler mengembalikan instance baru OrderHandler
func NewOrderHandler(db *sql.DB) *OrderHandler {
	return &OrderHandler{DB: db}
}

// CreateOrder menangani transaksi top-up menggunakan Database Transaction (POST /orders)
func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid: " + err.Error(),
		})
		return
	}

	// 1. Validasi Input Request
	req.Item = strings.TrimSpace(req.Item)
	if req.UserID <= 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Field 'user_id' wajib diisi dan harus > 0",
		})
		return
	}
	if req.Item == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Field 'item' tidak boleh kosong",
		})
		return
	}
	if req.Harga <= 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Field 'harga' harus lebih besar dari 0",
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// =========================================================================
	// LOGIKA SQL TRANSACTION (Tx):
	// =========================================================================
	// 1. Step A: Mulai Database Transaction
	tx, err := h.DB.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal memulai transaksi database: " + err.Error(),
		})
		return
	}

	// Defer Rollback: jika keluar karena error sebelum tx.Commit(),
	// seluruh query dibatalkan otomatis agar data tidak bocor.
	defer tx.Rollback()

	// 2. Step B: Row-Level Locking dengan 'SELECT ... FOR UPDATE'
	// Baris user dikunci agar operasi saldo aman dari concurrency race condition.
	var currentSaldo int64
	queryCheckUser := `SELECT saldo FROM users WHERE id = $1 FOR UPDATE;`
	err = tx.QueryRowContext(ctx, queryCheckUser, req.UserID).Scan(&currentSaldo)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusNotFound, models.Response{
				Success: false,
				Message: fmt.Sprintf("User dengan ID %d tidak ditemukan", req.UserID),
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal memeriksa saldo user di database",
		})
		return
	}

	// 3. Step C: Validasi Kecukupan Saldo
	if currentSaldo < req.Harga {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Saldo tidak cukup",
			Data: map[string]any{
				"saldo_saat_ini": currentSaldo,
				"harga_item":     req.Harga,
			},
		})
		return
	}

	// 4. Step D: Potong Saldo User
	queryDeduct := `UPDATE users SET saldo = saldo - $1 WHERE id = $2;`
	_, err = tx.ExecContext(ctx, queryDeduct, req.Harga, req.UserID)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal memotong saldo user: " + err.Error(),
		})
		return
	}

	// 5. Step E: Simpan Order Baru dengan Status 'Success'
	var newOrder models.Order
	queryInsertOrder := `
		INSERT INTO orders (user_id, item, harga, status)
		VALUES ($1, $2, $3, 'Success')
		RETURNING id, user_id, item, harga, status, created_at;
	`
	err = tx.QueryRowContext(ctx, queryInsertOrder, req.UserID, req.Item, req.Harga).Scan(
		&newOrder.ID,
		&newOrder.UserID,
		&newOrder.Item,
		&newOrder.Harga,
		&newOrder.Status,
		&newOrder.CreatedAt,
	)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal menyimpan data order: " + err.Error(),
		})
		return
	}

	// 6. Step F: Commit Transaksi
	if err := tx.Commit(); err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal memproses transaksi final: " + err.Error(),
		})
		return
	}

	// 7. Step G: Return Respon Sukses (201 Created) & Sisa Saldo
	sisaSaldo := currentSaldo - req.Harga
	utils.WriteJSON(w, http.StatusCreated, models.Response{
		Success: true,
		Message: "Order berhasil dibuat",
		Data: map[string]any{
			"order":      newOrder,
			"sisa_saldo": sisaSaldo,
		},
	})
}

// GetOrder menangani pengecekan detail order berdasarkan ID (GET /orders?id=1 atau /orders/1)
func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan GET",
		})
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr == "" {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) >= 2 && parts[0] == "orders" {
			idStr = parts[1]
		}
	}

	if idStr == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Parameter 'id' order wajib diisi. Contoh: /orders?id=1",
		})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "ID order harus berupa angka positif",
		})
		return
	}

	var order models.Order
	query := `SELECT id, user_id, item, harga, status, created_at FROM orders WHERE id = $1;`
	err = h.DB.QueryRow(query, id).Scan(
		&order.ID,
		&order.UserID,
		&order.Item,
		&order.Harga,
		&order.Status,
		&order.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusNotFound, models.Response{
				Success: false,
				Message: fmt.Sprintf("Order dengan ID %d tidak ditemukan", id),
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal mengambil data order",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Data:    order,
	})
}

// ListOrders menampilkan daftar order dengan filter user_id opsional (GET /orders atau GET /orders?user_id=1)
func (h *OrderHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan GET",
		})
		return
	}

	userIDStr := r.URL.Query().Get("user_id")

	var rows *sql.Rows
	var err error

	if userIDStr != "" {
		userID, parseErr := strconv.Atoi(userIDStr)
		if parseErr != nil {
			utils.WriteJSON(w, http.StatusBadRequest, models.Response{
				Success: false,
				Message: "user_id harus berupa angka",
			})
			return
		}
		query := `SELECT id, user_id, item, harga, status, created_at FROM orders WHERE user_id = $1 ORDER BY id DESC;`
		rows, err = h.DB.Query(query, userID)
	} else {
		query := `SELECT id, user_id, item, harga, status, created_at FROM orders ORDER BY id DESC;`
		rows, err = h.DB.Query(query)
	}

	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal mengambil daftar order",
		})
		return
	}
	defer rows.Close()

	list := make([]models.Order, 0)
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.Item, &o.Harga, &o.Status, &o.CreatedAt); err != nil {
			continue
		}
		list = append(list, o)
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Data:    list,
	})
}
