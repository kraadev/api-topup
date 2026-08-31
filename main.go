package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// Daftarkan route User (dari user.go)
	RegisterUserRoutes(mux)

	log.Println("Server jalan di http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
