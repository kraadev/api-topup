package utils

import (
	"encoding/json"
	"net/http"

	"api-topup/models"
)

// WriteJSON membantu mengirim response JSON secara rapi dan konsisten
func WriteJSON(w http.ResponseWriter, statusCode int, payload models.Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
