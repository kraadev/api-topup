package models

// Response merepresentasikan format response JSON seragam untuk API
type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
}
