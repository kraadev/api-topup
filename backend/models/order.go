package models

import "time"

// Order merepresentasikan model data pesanan transaksi produk digital
type Order struct {
	ID        int64     `json:"id"`
	UserID    int       `json:"user_id"`
	Item      string    `json:"item"`
	Harga     int64     `json:"harga"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

// CreateOrderRequest merepresentasikan payload body saat membuat transaksi baru
type CreateOrderRequest struct {
	UserID int    `json:"user_id"`
	Item   string `json:"item"`
	Harga  int64  `json:"harga"`
}
