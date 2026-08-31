package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupTestServer() *http.ServeMux {
	// Reset in-memory states
	mu.Lock()
	users = make(map[int]User)
	usersByUsername = make(map[string]int)
	nextUserID = 1
	mu.Unlock()

	orderMu.Lock()
	orders = make(map[int64]Order)
	nextOrderID = 1
	orderMu.Unlock()

	mux := http.NewServeMux()
	RegisterUserRoutes(mux)
	RegisterOrderRoutes(mux)
	return mux
}

func TestCompleteFlow(t *testing.T) {
	mux := setupTestServer()

	// 1. Register User
	regBody := `{"username": "budi123"}`
	req := httptest.NewRequest(http.MethodPost, "/users/register", bytes.NewBufferString(regBody))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on register, got %d: %s", w.Code, w.Body.String())
	}

	// 2. Top-up Saldo
	topupBody := `{"id": 1, "amount": 50000}`
	req = httptest.NewRequest(http.MethodPost, "/users/saldo", bytes.NewBufferString(topupBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on topup, got %d: %s", w.Code, w.Body.String())
	}

	// 3. Create Order - Saldo cukup (Sukses)
	orderBody := `{"user_id": 1, "product": "Mobile Legends 86 Diamonds", "target": "12345678 (2024)", "amount": 20000}`
	req = httptest.NewRequest(http.MethodPost, "/orders", bytes.NewBufferString(orderBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on order, got %d: %s", w.Code, w.Body.String())
	}

	// Cek sisa saldo user (harus 30.000)
	req = httptest.NewRequest(http.MethodGet, "/users?id=1", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var userRes struct {
		Success bool `json:"success"`
		Data    User `json:"data"`
	}
	if err := json.NewDecoder(w.Body).Decode(&userRes); err != nil {
		t.Fatalf("failed to decode user response: %v", err)
	}
	if userRes.Data.Saldo != 30000 {
		t.Fatalf("expected user saldo 30000, got %d", userRes.Data.Saldo)
	}

	// 4. Create Order - Saldo tidak cukup (Gagal 400)
	failOrderBody := `{"user_id": 1, "product": "Genshin 1980 Genesis", "target": "80001234", "amount": 400000}`
	req = httptest.NewRequest(http.MethodPost, "/orders", bytes.NewBufferString(failOrderBody))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request on insufficient balance, got %d", w.Code)
	}

	// 5. Cek Detail Order
	req = httptest.NewRequest(http.MethodGet, "/orders?id=1", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on get order, got %d", w.Code)
	}

	// 6. List Order per User
	req = httptest.NewRequest(http.MethodGet, "/orders?user_id=1", nil)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on list order per user, got %d", w.Code)
	}
}
