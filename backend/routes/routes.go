package routes

import (
	"database/sql"
	"net/http"

	"api-topup/handlers"
	"api-topup/middleware"
	"api-topup/models"
	"api-topup/utils"
)

// SetupRouter mendaftarkan semua endpoint API dan membungkusnya dengan middleware
func SetupRouter(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	userHandler := handlers.NewUserHandler(db)
	orderHandler := handlers.NewOrderHandler(db)

	// ==========================================
	// 1. Routes User
	// ==========================================
	mux.HandleFunc("/users/register", userHandler.CreateUser)
	mux.HandleFunc("/users/saldo", userHandler.UpdateSaldo)

	mux.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			userHandler.CreateUser(w, r)
		case http.MethodGet:
			userHandler.GetUser(w, r)
		default:
			utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
				Success: false,
				Message: "Method tidak diizinkan",
			})
		}
	})

	mux.HandleFunc("/users/", userHandler.GetUser)

	// ==========================================
	// 2. Routes Order
	// ==========================================
	mux.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			orderHandler.CreateOrder(w, r)
		case http.MethodGet:
			if r.URL.Query().Has("id") {
				orderHandler.GetOrder(w, r)
				return
			}
			orderHandler.ListOrders(w, r)
		default:
			utils.WriteJSON(w, http.StatusMethodNotAllowed, models.Response{
				Success: false,
				Message: "Method tidak diizinkan",
			})
		}
	})

	mux.HandleFunc("/orders/", orderHandler.GetOrder)

	// Bungkus router dengan CORS Middleware
	return middleware.CORS(mux)
}
