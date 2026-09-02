package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	"api-topup/routes"
	"github.com/DATA-DOG/go-sqlmock"
)

func TestCORSMiddleware(t *testing.T) {
	db, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer db.Close()

	handler := routes.SetupRouter(db)

	req := httptest.NewRequest(http.MethodOptions, "/orders", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200 for OPTIONS, got %d", w.Code)
	}

	origin := w.Header().Get("Access-Control-Allow-Origin")
	if origin != "http://localhost:5173" {
		t.Fatalf("expected origin http://localhost:5173, got %s", origin)
	}
}

func TestHandleCreateUser(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer db.Close()

	handler := routes.SetupRouter(db)

	rows := sqlmock.NewRows([]string{"id", "username", "name", "email", "saldo", "created_at"}).
		AddRow(1, "steaven", "steaven", "steaven@test.com", 50000, time.Now())

	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO users (username, name, email, password, saldo) VALUES ($1, $2, $3, $4, $5)")).
		WithArgs("steaven", "steaven", "steaven@test.com", "", int64(50000)).
		WillReturnRows(rows)

	body := `{"username": "steaven", "email": "steaven@test.com", "saldo": 50000}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleLogin(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer db.Close()

	handler := routes.SetupRouter(db)

	rows := sqlmock.NewRows([]string{"id", "username", "name", "email", "password", "avatar_url", "saldo", "created_at"}).
		AddRow(1, "steaven", "Steaven", "steaven@test.com", "secret123", "", 100000, time.Now())

	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, username, COALESCE(name, ''), COALESCE(email, ''), COALESCE(password, ''), COALESCE(avatar_url, ''), saldo, created_at FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1;")).
		WithArgs("steaven@test.com").
		WillReturnRows(rows)

	body := `{"email": "steaven@test.com", "password": "secret123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleCreateOrder_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer db.Close()

	handler := routes.SetupRouter(db)

	mock.ExpectBegin()

	userRows := sqlmock.NewRows([]string{"saldo"}).AddRow(int64(50000))
	mock.ExpectQuery(regexp.QuoteMeta("SELECT saldo FROM users WHERE id = $1 FOR UPDATE;")).
		WithArgs(1).
		WillReturnRows(userRows)

	mock.ExpectExec(regexp.QuoteMeta("UPDATE users SET saldo = saldo - $1 WHERE id = $2;")).
		WithArgs(int64(20000), 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	orderRows := sqlmock.NewRows([]string{"id", "user_id", "item", "harga", "status", "created_at"}).
		AddRow(101, 1, "Mobile Legends 86 Diamonds", 20000, "Success", time.Now())
	mock.ExpectQuery(regexp.QuoteMeta("INSERT INTO orders (user_id, item, harga, status)")).
		WithArgs(1, "Mobile Legends 86 Diamonds", int64(20000)).
		WillReturnRows(orderRows)

	mock.ExpectCommit()

	body := `{"user_id": 1, "item": "Mobile Legends 86 Diamonds", "harga": 20000}`
	req := httptest.NewRequest(http.MethodPost, "/orders", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestHandleCreateOrder_InsufficientBalance(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer db.Close()

	handler := routes.SetupRouter(db)

	mock.ExpectBegin()

	userRows := sqlmock.NewRows([]string{"saldo"}).AddRow(int64(10000))
	mock.ExpectQuery(regexp.QuoteMeta("SELECT saldo FROM users WHERE id = $1 FOR UPDATE;")).
		WithArgs(1).
		WillReturnRows(userRows)

	mock.ExpectRollback()

	body := `{"user_id": 1, "item": "Valorant 1375 Points", "harga": 50000}`
	req := httptest.NewRequest(http.MethodPost, "/orders", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request, got %d: %s", w.Code, w.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}
