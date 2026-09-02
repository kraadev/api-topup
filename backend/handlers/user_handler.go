package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"api-topup/models"
	"api-topup/utils"
)

// UserHandler membungkus dependensi database untuk handler user
type UserHandler struct {
	DB *sql.DB
}

// NewUserHandler mengembalikan instance baru UserHandler
func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{DB: db}
}

// CreateUser menangani pembuatan akun user baru (POST /users)
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

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Username tidak boleh kosong",
		})
		return
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
		INSERT INTO users (username, saldo)
		VALUES ($1, $2)
		RETURNING id, username, saldo, created_at;
	`
	err := h.DB.QueryRow(query, req.Username, req.Saldo).Scan(
		&newUser.ID,
		&newUser.Username,
		&newUser.Saldo,
		&newUser.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			utils.WriteJSON(w, http.StatusConflict, models.Response{
				Success: false,
				Message: fmt.Sprintf("Username '%s' sudah terdaftar", req.Username),
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
		Message: "User berhasil dibuat",
		Data:    newUser,
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
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Parameter 'id' user wajib diisi. Contoh: /users?id=1",
		})
		return
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
	query := `SELECT id, username, saldo, created_at FROM users WHERE id = $1;`
	err = h.DB.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.Saldo, &user.CreatedAt)
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
		utils.WriteJSON(w, http.StatusBadRequest, models.Response{
			Success: false,
			Message: "Field 'id' wajib diisi dan harus > 0",
		})
		return
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
		RETURNING id, username, saldo, created_at;
	`
	err := h.DB.QueryRow(query, req.Amount, req.ID).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
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
