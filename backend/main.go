package main

import (
	"log"
	"net/http"

	"api-topup/config"
	"api-topup/routes"
)

func main() {
	// 1. Inisialisasi Database PostgreSQL & Auto-Migration
	db, err := config.InitDB()
	if err != nil {
		log.Fatalf("❌ Error inisialisasi database: %v", err)
	}
	defer db.Close()

	// 2. Setup Routing & Middleware
	router := routes.SetupRouter(db)

	// 3. Jalankan Server
	port := ":8080"
	log.Printf("🚀 Server REST API Top-Up berjalan di http://localhost%s\n", port)
	if err := http.ListenAndServe(port, router); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
