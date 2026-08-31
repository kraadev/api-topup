package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ============================================================
// STRUCT ORDER
// ============================================================

// Order merepresentasikan data pesanan / transaksi top-up produk digital.
type Order struct {
	ID        int64  `json:"id"`         // ID unik transaksi / order (auto-increment)
	UserID    int    `json:"user_id"`    // ID user pembeli
	Product   string `json:"product"`    // Nama produk (contoh: "Mobile Legends 86 Diamonds")
	Target    string `json:"target"`     // Nomor / ID tujuan top-up (contoh: "12345678 (2024)")
	Amount    int64  `json:"amount"`     // Nominal / harga produk dalam satuan rupiah
	Status    string `json:"status"`     // Status transaksi ("SUCCESS", "PENDING", "FAILED")
	CreatedAt string `json:"created_at"` // Waktu transaksi dibuat (format RFC3339)
}

// ============================================================
// PENYIMPANAN IN-MEMORY
// ============================================================
// Kita pakai map[int64]Order untuk simulasi database pesanan.
// Menggunakan sync.RWMutex (orderMu) agar aman dari race condition saat diakses concurrent.

var (
	// orderMu mengunci akses ke orders dan nextOrderID
	orderMu sync.RWMutex

	// orders menyimpan data order dengan key = ID
	orders = make(map[int64]Order)

	// nextOrderID untuk auto-increment ID order. Mulai dari 1.
	nextOrderID int64 = 1
)

// ============================================================
// 1. HANDLER: BUAT ORDER BARU (TRANSAKSI TOP-UP)
// ============================================================
// Endpoint: POST /orders  ATAU  POST /orders/create
// Body JSON:
// {
//   "user_id": 1,
//   "product": "Mobile Legends 86 Diamonds",
//   "target": "12345678 (2024)",
//   "amount": 20000
// }
//
// Alur Proses:
// 1. Validasi input JSON (user_id, product, target, amount > 0)
// 2. Cek apakah user ada & saldo mencukupi
// 3. Potong saldo user secara atomic
// 4. Simpan order baru ke memory dengan status "SUCCESS"
// 5. Kembalikan detail order & sisa saldo user terbaru
//
// Response Sukses: 201 Created + data order & sisa saldo
// Response Gagal: 400 (bad request / saldo kurang), 404 (user tidak ada), 405 (method salah)

type requestOrder struct {
	UserID  int    `json:"user_id"`
	Product string `json:"product"`
	Target  string `json:"target"`
	Amount  int64  `json:"amount"`
}

// HandleCreateOrder menangani pembuatan transaksi top-up baru.
func HandleCreateOrder(w http.ResponseWriter, r *http.Request) {
	// Hanya izinkan method POST
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan POST",
		})
		return
	}

	// Decode body JSON
	var req requestOrder
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "body JSON tidak valid: " + err.Error(),
		})
		return
	}

	// Normalisasi & validasi field input
	req.Product = strings.TrimSpace(req.Product)
	req.Target = strings.TrimSpace(req.Target)

	if req.UserID <= 0 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'user_id' wajib diisi dan harus > 0",
		})
		return
	}

	if req.Product == "" {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'product' tidak boleh kosong",
		})
		return
	}

	if req.Target == "" {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'target' tidak boleh kosong",
		})
		return
	}

	if req.Amount <= 0 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'amount' harus lebih besar dari 0",
		})
		return
	}

	// ========================================================
	// VALIDASI USER & POTONG SALDO SECARA ATOMIC
	// ========================================================
	updatedUser, err := DeductBalance(req.UserID, req.Amount)
	if err != nil {
		// Cek apakah user ada untuk menentukan status code (404 vs 400)
		if _, exists := GetUserByID(req.UserID); !exists {
			writeJSON(w, http.StatusNotFound, response{
				Success: false,
				Message: fmt.Sprintf("user dengan id %d tidak ditemukan", req.UserID),
			})
			return
		}

		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	// ========================================================
	// SIMPAN TRANSAKSI KE IN-MEMORY STORAGE
	// ========================================================
	orderMu.Lock()
	newOrder := Order{
		ID:        nextOrderID,
		UserID:    req.UserID,
		Product:   req.Product,
		Target:    req.Target,
		Amount:    req.Amount,
		Status:    "SUCCESS",
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	orders[newOrder.ID] = newOrder
	nextOrderID++
	orderMu.Unlock()

	// Response sukses dengan detail order dan sisa saldo
	writeJSON(w, http.StatusCreated, response{
		Success: true,
		Message: "order top-up berhasil dibuat",
		Data: map[string]any{
			"order":      newOrder,
			"sisa_saldo": updatedUser.Saldo,
		},
	})
}

// ============================================================
// 2. HANDLER: CEK DETAIL ORDER
// ============================================================
// Endpoint: GET /orders?id=1  ATAU  GET /orders/1
// Sukses: 200 OK + data order
// Gagal: 404 jika order tidak ditemukan, 400 jika ID tidak valid

// HandleGetOrder menangani request untuk melihat detail order berdasarkan ID.
func HandleGetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan GET",
		})
		return
	}

	// Ambil ID dari URL (PathValue, query param "?id=1", atau fallback URL path "/orders/1")
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
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "parameter 'id' wajib diisi. Contoh: /orders?id=1 atau /orders/1",
		})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "id harus berupa angka",
		})
		return
	}

	orderMu.RLock()
	order, exists := orders[id]
	orderMu.RUnlock()

	if !exists {
		writeJSON(w, http.StatusNotFound, response{
			Success: false,
			Message: fmt.Sprintf("order dengan id %d tidak ditemukan", id),
		})
		return
	}

	writeJSON(w, http.StatusOK, response{
		Success: true,
		Data:    order,
	})
}

// ============================================================
// 3. HANDLER: LIST SEMUA ORDER & FILTER BY USER
// ============================================================
// Endpoint: GET /orders              -> semua pesanan
// Endpoint: GET /orders?user_id=1    -> pesanan milik user tertentu
// Sukses: 200 OK + array data order

// HandleListOrders menampilkan daftar order (semua atau difilter per user).
func HandleListOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan GET",
		})
		return
	}

	userIDStr := r.URL.Query().Get("user_id")

	orderMu.RLock()
	defer orderMu.RUnlock()

	list := make([]Order, 0, len(orders))

	// Jika ada filter user_id
	if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, response{
				Success: false,
				Message: "user_id harus berupa angka",
			})
			return
		}

		for _, o := range orders {
			if o.UserID == userID {
				list = append(list, o)
			}
		}
	} else {
		for _, o := range orders {
			list = append(list, o)
		}
	}

	writeJSON(w, http.StatusOK, response{
		Success: true,
		Data:    list,
	})
}

// ============================================================
// HELPER ROUTING ORDER
// ============================================================

// RegisterOrderRoutes adalah helper untuk mendaftarkan semua route Order ke http.ServeMux.
// Panggil fungsi ini dari main.go agar main.go tetap rapi dan modular.
func RegisterOrderRoutes(mux *http.ServeMux) {
	// POST /orders/create -> buat order baru (alternatif endpoint)
	mux.HandleFunc("/orders/create", HandleCreateOrder)

	// Routing fleksibel untuk /orders
	// POST   /orders          -> buat order baru
	// GET    /orders?id=1     -> detail order via query param
	// GET    /orders?user_id=1-> list order berdasarkan user
	// GET    /orders          -> list semua order
	mux.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			HandleCreateOrder(w, r)
		case http.MethodGet:
			if r.URL.Query().Has("id") {
				HandleGetOrder(w, r)
				return
			}
			HandleListOrders(w, r)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, response{
				Success: false,
				Message: "method tidak diizinkan, gunakan GET atau POST",
			})
		}
	})

	// Fallback untuk route detail dengan format path /orders/{id}
	mux.HandleFunc("/orders/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, response{
				Success: false,
				Message: "method tidak diizinkan, gunakan GET",
			})
			return
		}
		HandleGetOrder(w, r)
	})
}

/*
================================================================
CONTOH REQUEST DENGAN CURL (untuk testing Order)
================================================================

# 1. Buat order baru (Top-up Mobile Legends Rp 20.000)
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id":1, "product":"Mobile Legends 86 Diamonds", "target":"12345678 (2024)", "amount":20000}'

# 2. Cek detail order berdasarkan ID
curl http://localhost:8080/orders?id=1
# atau
curl http://localhost:8080/orders/1

# 3. Lihat semua daftar order
curl http://localhost:8080/orders

# 4. Filter daftar order milik user tertentu (user_id=1)
curl http://localhost:8080/orders?user_id=1

*/
