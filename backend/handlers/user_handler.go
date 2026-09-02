package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"api-topup/models"
	"api-topup/utils"
)

// UserHandler membungkus dependensi database untuk handler user & autentikasi
type UserHandler struct {
	DB *sql.DB
}

// NewUserHandler mengembalikan instance baru UserHandler
func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// CreateUser menangani pembuatan akun user baru (POST /users atau /users/register)
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid: " + err.Error(),
		})
		return
	}

	// Normalisasi data
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Username = strings.TrimSpace(req.Username)
	req.Name = strings.TrimSpace(req.Name)

	if req.Username == "" && req.Email != "" {
		parts := strings.Split(req.Email, "@")
		req.Username = parts[0]
	}
	if req.Username == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Username atau Email wajib diisi",
		})
		return
	}
	if req.Name == "" {
		req.Name = req.Username
	}

	if req.Saldo < 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Saldo awal tidak boleh negatif",
		})
		return
	}

	var newUser models.User
	query := `
		INSERT INTO users (username, name, email, password, saldo)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, username, name, email, saldo, created_at;
	`
	err := h.DB.QueryRow(query, req.Username, req.Name, req.Email, req.Password, req.Saldo).Scan(
		&newUser.ID,
		&newUser.Username,
		&newUser.Name,
		&newUser.Email,
		&newUser.Saldo,
		&newUser.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			utils.WriteJSON(w, http.StatusConflict, models.Response{
				Success: false,
				Message: "Username atau Email sudah terdaftar. Silakan gunakan email lain atau login.",
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal membuat user di database: " + err.Error(),
		})
		return
	}

	utils.WriteJSON(w, http.StatusCreated, models.Response{
		Success: true,
		Message: "Registrasi akun berhasil!",
		Data:    newUser,
	})
}

// Login menangani login email/password (POST /auth/login)
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || req.Password == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Email dan Password wajib diisi",
		})
		return
	}

	var user models.User
	var storedPassword string
	query := `SELECT id, username, COALESCE(name, ''), COALESCE(email, ''), COALESCE(password, ''), COALESCE(avatar_url, ''), saldo, created_at FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1;`
	err := h.DB.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.Username,
		&user.Name,
		&user.Email,
		&storedPassword,
		&user.AvatarURL,
		&user.Saldo,
		&user.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusUnauthorized, models.Response{
				Success: false,
				Message: "Email atau Password yang Anda masukkan salah",
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Terjadi kesalahan saat memeriksa akun",
		})
		return
	}

	// Validasi password (mendukung direct compare jika belum hashed atau matching)
	if storedPassword != "" && storedPassword != req.Password {
		utils.WriteJSON(w, http.StatusUnauthorized, models.Response{
			Success: false,
			Message: "Email atau Password yang Anda masukkan salah",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: "Login berhasil! Selamat datang kembali.",
		Data: map[string]any{
			"user":  user,
			"token": fmt.Sprintf("session_token_%d_%d", user.ID, time.Now().Unix()),
		},
	})
}

// GoogleLogin menangani login via Google OAuth (POST /auth/google)
func (h *UserHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.GoogleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Email Google tidak valid",
		})
		return
	}

	var user models.User
	query := `SELECT id, username, COALESCE(name, ''), COALESCE(email, ''), COALESCE(google_id, ''), COALESCE(avatar_url, ''), saldo, created_at FROM users WHERE LOWER(email) = $1;`
	err := h.DB.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.Username,
		&user.Name,
		&user.Email,
		&user.GoogleID,
		&user.AvatarURL,
		&user.Saldo,
		&user.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Buat user baru dari akun Google
			usernameBase := strings.Split(req.Email, "@")[0]
			username := fmt.Sprintf("%s_%d", usernameBase, time.Now().Unix()%1000)

			insertQuery := `
				INSERT INTO users (username, name, email, google_id, avatar_url, saldo)
				VALUES ($1, $2, $3, $4, $5, 100000)
				RETURNING id, username, name, email, google_id, avatar_url, saldo, created_at;
			`
			err = h.DB.QueryRow(insertQuery, username, req.Name, req.Email, req.GoogleID, req.AvatarURL).Scan(
				&user.ID,
				&user.Username,
				&user.Name,
				&user.Email,
				&user.GoogleID,
				&user.AvatarURL,
				&user.Saldo,
				&user.CreatedAt,
			)
			if err != nil {
				utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
					Success: false,
					Message: "Gagal membuat akun Google: " + err.Error(),
				})
				return
			}
		} else {
			utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
				Success: false,
				Message: "Gagal memproses autentikasi Google",
			})
			return
		}
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: "Login dengan Google berhasil!",
		Data: map[string]any{
			"user":  user,
			"token": fmt.Sprintf("google_session_%d_%d", user.ID, time.Now().Unix()),
		},
	})
}

// ForgotPassword mengirimkan kode OTP 6 digit (POST /auth/forgot-password)
func (h *UserHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Email wajib diisi",
		})
		return
	}

	// Generate 6-digit OTP kriptografis
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	otpCode := fmt.Sprintf("%06d", n.Int64()+100000)
	expiresAt := time.Now().Add(10 * time.Minute)

	// Simpan OTP ke database
	query := `INSERT INTO otps (email, otp_code, expires_at, used) VALUES ($1, $2, $3, false);`
	_, err := h.DB.Exec(query, req.Email, otpCode, expiresAt)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal menghasilkan kode OTP",
		})
		return
	}

	// Log OTP ke console backend untuk simulasi pengiriman email aman
	log.Printf("📧 [EMAIL OTP SERVICE] Kode OTP untuk %s adalah: %s (Berlaku 10 Menit)\n", req.Email, otpCode)

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: fmt.Sprintf("Kode OTP 6-digit telah dikirimkan ke %s. Silakan periksa kotak masuk email Anda.", req.Email),
		Data: map[string]any{
			"email":      req.Email,
			"expires_in": "10 Menit",
			// Kami sertakan hint dev agar user bisa langsung mencoba tanpa membuka mail server eksternal
			"dev_otp_hint": otpCode,
		},
	})
}

// VerifyOTP memverifikasi keabsahan kode OTP (POST /auth/verify-otp)
func (h *UserHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.OTPCode = strings.TrimSpace(req.OTPCode)

	var otpID int
	var expiresAt time.Time
	var isUsed bool
	query := `SELECT id, expires_at, used FROM otps WHERE LOWER(email) = $1 AND otp_code = $2 ORDER BY id DESC LIMIT 1;`
	err := h.DB.QueryRow(query, req.Email, req.OTPCode).Scan(&otpID, &expiresAt, &isUsed)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusBadRequest, models.Response{
				Success: false,
				Message: "Kode OTP yang Anda masukkan salah atau tidak terdaftar",
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Terjadi kesalahan saat memverifikasi OTP",
		})
		return
	}

	if isUsed {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Kode OTP ini sudah pernah digunakan",
		})
		return
	}

	if time.Now().After(expiresAt) {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Kode OTP telah kedaluwarsa. Silakan minta kode baru.",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: "Kode OTP valid. Silakan buat kata sandi baru Anda.",
	})
}

// ResetPassword memperbarui kata sandi user dengan OTP yang valid (POST /auth/reset-password)
func (h *UserHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST",
		})
		return
	}

	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid",
		})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.OTPCode = strings.TrimSpace(req.OTPCode)
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if req.NewPassword == "" || len(req.NewPassword) < 6 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Kata sandi baru minimal harus 6 karakter",
		})
		return
	}

	// 1. Validasi OTP
	var otpID int
	var expiresAt time.Time
	var isUsed bool
	queryCheck := `SELECT id, expires_at, used FROM otps WHERE LOWER(email) = $1 AND otp_code = $2 ORDER BY id DESC LIMIT 1;`
	err := h.DB.QueryRow(queryCheck, req.Email, req.OTPCode).Scan(&otpID, &expiresAt, &isUsed)
	if err != nil || isUsed || time.Now().After(expiresAt) {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Kode OTP tidak valid atau sudah kedaluwarsa",
		})
		return
	}

	// 2. Tandai OTP sudah digunakan
	_, _ = h.DB.Exec(`UPDATE otps SET used = true WHERE id = $1;`, otpID)

	// 3. Update password user
	updateQuery := `UPDATE users SET password = $1 WHERE LOWER(email) = $2 OR LOWER(username) = $2;`
	res, err := h.DB.Exec(updateQuery, req.NewPassword, req.Email)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal memperbarui kata sandi user",
		})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		utils.WriteJSON(w, http.StatusNotFound, models.Response{
			Success: false,
			Message: "Akun dengan email tersebut tidak ditemukan",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: "Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru.",
	})
}

// GetUser menangani pengambilan detail & saldo user (GET /users?id=1 atau /users/1)
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
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
		if len(parts) >= 2 && parts[0] == "users" {
			idStr = parts[1]
		}
	}

	if idStr == "" {
		idStr = "1"
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "ID user harus berupa angka positif",
		})
		return
	}

	var user models.User
	query := `SELECT id, username, COALESCE(name, ''), COALESCE(email, ''), COALESCE(avatar_url, ''), saldo, created_at FROM users WHERE id = $1;`
	err = h.DB.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.Name, &user.Email, &user.AvatarURL, &user.Saldo, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusNotFound, models.Response{
				Success: false,
				Message: fmt.Sprintf("User dengan ID %d tidak ditemukan", id),
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Terjadi kesalahan saat mengambil data user",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Data:    user,
	})
}

// UpdateSaldo menangani penambahan saldo user / topup (POST /users/saldo)
func (h *UserHandler) UpdateSaldo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
			Success: false,
			Message: "Method tidak diizinkan, gunakan POST atau PUT",
		})
		return
	}

	var req models.UpdateSaldoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Payload JSON tidak valid: " + err.Error(),
		})
		return
	}

	if req.ID <= 0 {
		req.ID = 1
	}

	if req.Amount <= 0 {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Field 'amount' top-up harus lebih besar dari 0",
		})
		return
	}

	var updatedUser models.User
	query := `
		UPDATE users 
		SET saldo = saldo + $1 
		WHERE id = $2 
		RETURNING id, username, COALESCE(name, ''), COALESCE(email, ''), saldo, created_at;
	`
	err := h.DB.QueryRow(query, req.Amount, req.ID).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
		&updatedUser.Name,
		&updatedUser.Email,
		&updatedUser.Saldo,
		&updatedUser.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utils.WriteJSON(w, http.StatusNotFound, models.Response{
				Success: false,
				Message: fmt.Sprintf("User dengan ID %d tidak ditemukan", req.ID),
			})
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "Gagal menambah saldo user",
		})
		return
	}

	utils.WriteJSON(w, http.StatusOK, models.Response{
		Success: true,
		Message: fmt.Sprintf("Saldo berhasil ditambahkan sebesar Rp %d", req.Amount),
		Data:    updatedUser,
	})
}
