package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"

	"referencer/backend/internal/db"
	"referencer/backend/internal/models"
)

// HandleShare returns an HTTP handler for creating share links.
func HandleShare(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.ShareRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.Access != "edit" && req.Access != "readonly" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"error": "access must be 'edit' or 'readonly'",
			})
			return
		}

		code, err := database.CreateShareLink(req.WorkspaceID, req.Access)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.ShareResponse{
			Code: code,
			URL:  "/s/" + code,
		})
	}
}

// HandleResolveShare returns an HTTP handler for resolving share links.
func HandleResolveShare(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		code := chi.URLParam(r, "code")

		workspaceID, access, err := database.ResolveShareLink(code)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if workspaceID == "" {
			// Share link not found - serve index.html as fallback.
			http.ServeFile(w, r, filepath.Join(staticDir(), "index.html"))
			return
		}

		if access == "readonly" {
			http.Redirect(w, r, fmt.Sprintf("/space/%s?access=readonly", workspaceID), http.StatusFound)
		} else {
			http.Redirect(w, r, fmt.Sprintf("/space/%s", workspaceID), http.StatusFound)
		}
	}
}

// HandleBibleAPI returns an HTTP handler for the Bible API proxy.
func HandleBibleAPI() http.HandlerFunc {
	devMode := os.Getenv("DEVELOPMENT_MODE") != ""
	apiKey := os.Getenv("API_KEY")

	return func(w http.ResponseWriter, r *http.Request) {
		query := chi.URLParam(r, "query")

		if devMode {
			handleDevPassages(w, query)
			return
		}

		handleProdPassages(w, query, apiKey)
	}
}

func handleDevPassages(w http.ResponseWriter, query string) {
	filename := strings.ToLower(query) + ".json"
	path := filepath.Join(".", "data", filename)

	data, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, fmt.Sprintf("passage not found: %s", query), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func handleProdPassages(w http.ResponseWriter, query, apiKey string) {
	url := fmt.Sprintf("https://api.esv.org/v3/passage/text/?q=%s&include-short-copyright=false", query)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, "failed to create request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Authorization", "Token "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "failed to fetch passage", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func staticDir() string {
	return filepath.Join(".", "frontend", "dist")
}
