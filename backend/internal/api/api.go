package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"

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
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{
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

func staticDir() string {
	return filepath.Join(".", "frontend", "dist")
}
