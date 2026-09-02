package models

import "time"

// User merepresentasikan model data pengguna
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Name      string    `json:"name,omitempty"`
	Email     string    `json:"email,omitempty"`
	Password  string    `json:"-"`
	GoogleID  string    `json:"google_id,omitempty"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	Saldo     int64     `json:"saldo"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

// CreateUserRequest merepresentasikan payload body saat pendaftaran user
type CreateUserRequest struct {
	Username string `json:"username,omitempty"`
	Name     string `json:"name,omitempty"`
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`
	Saldo    int64  `json:"saldo,omitempty"`
}

// LoginRequest merepresentasikan payload login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// GoogleAuthRequest merepresentasikan payload Google OAuth login
type GoogleAuthRequest struct {
	Email     string `json:"email"`
	Name      string `json:"name"`
	GoogleID  string `json:"google_id"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

// ForgotPasswordRequest merepresentasikan payload permintaan OTP reset password
type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// VerifyOTPRequest merepresentasikan payload verifikasi OTP
type VerifyOTPRequest struct {
	Email   string `json:"email"`
	OTPCode string `json:"otp_code"`
}

// ResetPasswordRequest merepresentasikan payload ganti password dengan OTP
type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTPCode     string `json:"otp_code"`
	NewPassword string `json:"new_password"`
}

// UpdateSaldoRequest merepresentasikan payload body saat top-up saldo
type UpdateSaldoRequest struct {
	ID     int   `json:"id"`
	Amount int64 `json:"amount"`
}
