package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// Daftarkan semua route user (dari user.go)
	RegisterUserRoutes(mux)

	// Daftarkan semua route order (dari order.go)
	RegisterOrderRoutes(mux)

	log.Println("Server jalan di http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
