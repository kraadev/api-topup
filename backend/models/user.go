package models

import "time"

// User merepresentasikan model data pengguna
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Saldo     int64     `json:"saldo"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

// CreateUserRequest merepresentasikan payload body saat pendaftaran user
type CreateUserRequest struct {
	Username string `json:"username"`
	Saldo    int64  `json:"saldo"`
}

// UpdateSaldoRequest merepresentasikan payload body saat top-up saldo
type UpdateSaldoRequest struct {
	ID     int    `json:"id"`
	Amount int64  `json:"amount"`
}
