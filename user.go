package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

// ============================================================
// STRUCT USER
// ============================================================

// User merepresentasikan data member / pengguna di sistem top-up.
// Dibuat simpel sesuai kebutuhan mock-up: ID unik, Username, dan Saldo.
type User struct {
	ID       int    `json:"id"`       // ID unik user (auto-increment)
	Username string `json:"username"` // Username harus unik
	Saldo    int64  `json:"saldo"`    // Saldo dalam satuan rupiah (int64 biar aman untuk nominal besar)
}

// ============================================================
// PENYIMPANAN IN-MEMORY
// ============================================================
// Kita pakai map[int]User untuk simulasi database.
// Karena HTTP handler dijalankan secara concurrent (goroutine per request),
// kita wajib pakai sync.RWMutex biar aman dari race condition.
//
// Catatan: Data akan hilang saat server restart, ini memang sengaja
// untuk tahap mock-up / development awal.

var (
	// mu mengunci akses ke users, usersByUsername, dan nextUserID
	mu sync.RWMutex

	// users menyimpan data user dengan key = ID
	users = make(map[int]User)

	// usersByUsername untuk cek duplikat username dengan cepat, value = ID
	usersByUsername = make(map[string]int)

	// nextUserID untuk auto-increment ID. Mulai dari 1.
	nextUserID = 1
)

// ============================================================
// HELPER: Response JSON Standar
// ============================================================

// response adalah format balasan JSON yang konsisten untuk semua handler.
type response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
}

// writeJSON membantu menulis response JSON dengan header dan status code yang benar.
func writeJSON(w http.ResponseWriter, statusCode int, payload response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	// json.NewEncoder lebih efisien daripada json.Marshal + w.Write
	_ = json.NewEncoder(w).Encode(payload)
}

// ============================================================
// 1. HANDLER: REGISTRASI USER BARU
// ============================================================
// Endpoint: POST /users/register
// Body JSON: { "username": "budi123" }
// Sukses: 201 Created + data user baru
// Gagal: 400 jika username kosong / sudah terpakai

// requestRegister adalah struktur untuk menangkap body JSON saat registrasi.
type requestRegister struct {
	Username string `json:"username"`
}

// HandleRegisterUser menangani pendaftaran user baru.
func HandleRegisterUser(w http.ResponseWriter, r *http.Request) {
	// Hanya izinkan method POST
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan POST",
		})
		return
	}

	// Decode body JSON
	var req requestRegister
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "body JSON tidak valid: " + err.Error(),
		})
		return
	}

	// Validasi & normalisasi username
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "username tidak boleh kosong",
		})
		return
	}
	if len(req.Username) < 3 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "username minimal 3 karakter",
		})
		return
	}

	mu.Lock() // Lock tulis karena kita akan mengubah map
	defer mu.Unlock()

	// Cek duplikat username
	if _, exists := usersByUsername[req.Username]; exists {
		writeJSON(w, http.StatusConflict, response{
			Success: false,
			Message: fmt.Sprintf("username '%s' sudah terdaftar", req.Username),
		})
		return
	}

	// Buat user baru
	newUser := User{
		ID:       nextUserID,
		Username: req.Username,
		Saldo:    0, // Saldo awal 0
	}

	// Simpan ke in-memory storage
	users[newUser.ID] = newUser
	usersByUsername[newUser.Username] = newUser.ID
	nextUserID++ // Siapkan ID untuk user berikutnya

	writeJSON(w, http.StatusCreated, response{
		Success: true,
		Message: "user berhasil didaftarkan",
		Data:    newUser,
	})
}

// ============================================================
// 2. HANDLER: CEK DETAIL / SALDO USER
// ============================================================
// Endpoint: GET /users?id=1  ATAU  GET /users/1
// Mendukung dua cara ambil ID agar fleksibel dengan net/http native.
// - Query param: /users?id=1 (kompatibel semua versi Go)
// - Path value: /users/{id} (Go 1.22+ dengan r.PathValue)
//
// Sukses: 200 OK + data user
// Gagal: 404 jika user tidak ditemukan

// HandleGetUser menangani request untuk melihat detail & saldo user.
func HandleGetUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan GET",
		})
		return
	}

	// Ambil ID dari URL. Coba 2 cara:
	// 1. Dari PathValue (untuk pattern Go 1.22+ seperti "/users/{id}")
	// 2. Dari query param "?id=1"
	// 3. Dari path manual "/users/1" (fallback jika tanpa framework)
	idStr := r.PathValue("id")
	if idStr == "" {
		idStr = r.URL.Query().Get("id")
	}
	if idStr == "" {
		// Fallback: parsing manual dari URL path, misal "/users/1" -> "1"
		// Ini berguna kalau di main.go pakai http.HandleFunc("/users/", handler)
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(parts) == 2 && parts[0] == "users" {
			idStr = parts[1]
		}
	}

	if idStr == "" {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "parameter 'id' wajib diisi. Contoh: /users?id=1 atau /users/1",
		})
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "id harus berupa angka",
		})
		return
	}

	mu.RLock() // Lock baca saja, karena cuma membaca data
	user, exists := users[id]
	mu.RUnlock()

	if !exists {
		writeJSON(w, http.StatusNotFound, response{
			Success: false,
			Message: fmt.Sprintf("user dengan id %d tidak ditemukan", id),
		})
		return
	}

	writeJSON(w, http.StatusOK, response{
		Success: true,
		Data:    user,
	})
}

// ============================================================
// 3. HANDLER: TAMBAH / POTONG SALDO USER
// ============================================================
// Endpoint: POST /users/saldo  ATAU  PUT /users/saldo
// Body JSON: { "id": 1, "amount": 50000 }
//            { "id": 1, "amount": -20000 } untuk potong saldo
// Alternatif body: { "id": 1, "type": "topup", "amount": 50000 }
//                  { "id": 1, "type": "deduct", "amount": 20000 }
//
// Logika:
// - amount positif = tambah saldo
// - amount negatif = potong saldo (atau pakai field "type")
// - Validasi: saldo tidak boleh jadi negatif (minus)
// Sukses: 200 OK + data user terbaru
// Gagal: 400 jika amount 0 / saldo tidak cukup, 404 jika user tidak ada

type requestSaldo struct {
	ID     int    `json:"id"`
	Amount int64  `json:"amount"`          // Bisa positif (tambah) atau negatif (potong)
	Type   string `json:"type,omitempty"` // Opsional: "topup" / "tambah" / "deduct" / "potong"
}

// HandleUpdateSaldo menangani penambahan & pengurangan saldo.
func HandleUpdateSaldo(w http.ResponseWriter, r *http.Request) {
	// Izinkan POST atau PUT biar fleksibel
	if r.Method != http.MethodPost && r.Method != http.MethodPut && r.Method != http.MethodPatch {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan POST / PUT / PATCH",
		})
		return
	}

	var req requestSaldo
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "body JSON tidak valid: " + err.Error(),
		})
		return
	}

	// Validasi ID
	if req.ID == 0 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'id' wajib diisi",
		})
		return
	}

	// Validasi Amount
	if req.Amount == 0 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "field 'amount' tidak boleh 0",
		})
		return
	}

	// Normalisasi field Type jika diisi
	// Jika user mengirim type="deduct"/"potong", kita paksa amount jadi negatif
	// Jika type="topup"/"tambah", kita paksa amount jadi positif
	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	switch req.Type {
	case "deduct", "potong", "kurang", "debit":
		if req.Amount > 0 {
			req.Amount = -req.Amount // ubah jadi negatif
		}
	case "topup", "tambah", "plus", "credit":
		if req.Amount < 0 {
			req.Amount = -req.Amount // ubah jadi positif
		}
	case "":
		// Tidak ada type, biarkan amount apa adanya (positif/negatif sudah menentukan)
	default:
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: "type tidak valid, gunakan 'topup' atau 'deduct'",
		})
		return
	}

	mu.Lock()
	defer mu.Unlock()

	user, exists := users[req.ID]
	if !exists {
		writeJSON(w, http.StatusNotFound, response{
			Success: false,
			Message: fmt.Sprintf("user dengan id %d tidak ditemukan", req.ID),
		})
		return
	}

	// Cek apakah saldo akan menjadi negatif
	newSaldo := user.Saldo + req.Amount
	if newSaldo < 0 {
		writeJSON(w, http.StatusBadRequest, response{
			Success: false,
			Message: fmt.Sprintf("saldo tidak mencukupi. Saldo saat ini: %d, percobaan potong: %d", user.Saldo, -req.Amount),
		})
		return
	}

	// Update saldo
	user.Saldo = newSaldo
	users[req.ID] = user // simpan kembali ke map

	// Tentukan pesan aksi
	action := "ditambahkan"
	if req.Amount < 0 {
		action = "dipotong"
	}

	writeJSON(w, http.StatusOK, response{
		Success: true,
		Message: fmt.Sprintf("saldo berhasil %s sebesar %d. Saldo terbaru: %d", action, req.Amount, user.Saldo),
		Data:    user,
	})
}

// ============================================================
// BONUS: Handler untuk list semua user & helper routing
// ============================================================

// HandleListUsers menampilkan semua user yang terdaftar (berguna untuk debugging mock-up).
// Endpoint: GET /users
func HandleListUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, response{
			Success: false,
			Message: "method tidak diizinkan, gunakan GET",
		})
		return
	}

	mu.RLock()
	defer mu.RUnlock()

	// Ubah map jadi slice biar enak di-JSON-kan sebagai array
	list := make([]User, 0, len(users))
	for _, u := range users {
		list = append(list, u)
	}

	writeJSON(w, http.StatusOK, response{
		Success: true,
		Data:    list,
	})
}

// ============================================================
// HELPER / SERVICE: OPERASI USER & SALDO
// ============================================================

// GetUserByID mengambil data user berdasarkan ID (thread-safe).
func GetUserByID(id int) (User, bool) {
	mu.RLock()
	defer mu.RUnlock()
	user, exists := users[id]
	return user, exists
}

// GetBalance mengambil saldo user berdasarkan ID (thread-safe).
func GetBalance(userID int) int64 {
	mu.RLock()
	defer mu.RUnlock()

	user, exists := users[userID]
	if !exists {
		return 0
	}

	return user.Saldo
}

// DeductBalance memotong saldo user secara aman (thread-safe & atomic).
// Error jika user tidak ditemukan, amount tidak valid, atau saldo tidak mencukupi.
func DeductBalance(userID int, amount int64) (User, error) {
	if amount <= 0 {
		return User{}, fmt.Errorf("amount harus lebih besar dari 0")
	}

	mu.Lock()
	defer mu.Unlock()

	user, exists := users[userID]
	if !exists {
		return User{}, fmt.Errorf("user dengan id %d tidak ditemukan", userID)
	}

	if user.Saldo < amount {
		return user, fmt.Errorf("saldo tidak mencukupi. Saldo saat ini: %d, dibutuhkan: %d", user.Saldo, amount)
	}

	user.Saldo -= amount
	users[userID] = user

	return user, nil
}

// RegisterUserRoutes adalah helper untuk mendaftarkan semua route User ke http.ServeMux.
// Panggil fungsi ini dari main.go biar main.go tetap bersih.
// Contoh pemakaian di main.go ada di komentar bawah.
func RegisterUserRoutes(mux *http.ServeMux) {
	// POST   /users/register -> registrasi
	mux.HandleFunc("/users/register", HandleRegisterUser)

	// GET    /users          -> list semua user (jika tanpa ?id)
	// GET    /users?id=1     -> detail user via query param
	// PUT/POST /users/saldo  -> topup / deduct saldo
	mux.HandleFunc("/users/saldo", HandleUpdateSaldo)
	mux.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		// Routing sederhana di dalam satu handler "/users"
		// Jika ada query ?id= -> anggap cek detail, jika tidak -> list semua
		if r.URL.Query().Has("id") {
			HandleGetUser(w, r)
			return
		}
		// Jika path-nya "/users/1" (ada ID di path), arahkan ke HandleGetUser juga
		if strings.HasPrefix(r.URL.Path, "/users/") && len(strings.TrimPrefix(r.URL.Path, "/users/")) > 0 {
			HandleGetUser(w, r)
			return
		}
		HandleListUsers(w, r)
	})

	// Fallback untuk route detail dengan format path /users/{id}
	mux.HandleFunc("/users/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, response{
				Success: false,
				Message: "method tidak diizinkan, gunakan GET",
			})
			return
		}
		HandleGetUser(w, r)
	})

	// Untuk Go 1.22+ kamu juga bisa pakai pattern yang lebih eksplisit:
	// mux.HandleFunc("GET /users/{id}", HandleGetUser)
	// mux.HandleFunc("GET /users", HandleListUsers)
}

/*
================================================================
CONTOH PENGGUNAAN DI main.go (tinggal copy-paste)
================================================================

package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// Daftarkan semua route user
	RegisterUserRoutes(mux)

	// Tambahkan route lain untuk fitur top-up produk digital kamu di sini
	// mux.HandleFunc("/topup", HandleTopup)

	log.Println("Server jalan di http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

================================================================
CONTOH REQUEST DENGAN CURL (untuk testing)
================================================================

# 1. Registrasi user baru
curl -X POST http://localhost:8080/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"budi123"}'

# 2. Cek detail / saldo user
curl http://localhost:8080/users?id=1
# atau
curl http://localhost:8080/users/1

# 3. Lihat semua user
curl http://localhost:8080/users

# 4. Tambah saldo (topup) 50.000
curl -X POST http://localhost:8080/users/saldo \
  -H "Content-Type: application/json" \
  -d '{"id":1, "amount":50000}'

# atau dengan field type yang eksplisit:
curl -X POST http://localhost:8080/users/saldo \
  -H "Content-Type: application/json" \
  -d '{"id":1, "type":"topup", "amount":50000}'

# 5. Potong saldo 20.000 (misal untuk transaksi top-up)
curl -X POST http://localhost:8080/users/saldo \
  -H "Content-Type: application/json" \
  -d '{"id":1, "amount":-20000}'

# atau:
curl -X POST http://localhost:8080/users/saldo \
  -H "Content-Type: application/json" \
  -d '{"id":1, "type":"deduct", "amount":20000}'

*/
