package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// TODO: Tambahkan route lain di sini
	// Contoh: mux.HandleFunc("/topup", HandleTopup)

	log.Println("Server jalan di http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
