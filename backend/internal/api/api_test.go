package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"referencer/backend/internal/db"
	"referencer/backend/internal/models"
)

func newTestDB(t *testing.T) *db.DB {
	t.Helper()
	d, err := db.NewDB(":memory:")
	if err != nil {
		t.Fatalf("NewDB: %v", err)
	}
	t.Cleanup(func() { d.Close() })
	return d
}

func TestHandleShare(t *testing.T) {
	t.Run("valid request", func(t *testing.T) {
		database := newTestDB(t)
		database.EnsureWorkspace("ws1")
		handler := HandleShare(database)

		body := `{"workspaceId":"ws1","access":"edit"}`
		req := httptest.NewRequest("POST", "/api/share", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}

		var shareResp models.ShareResponse
		json.NewDecoder(resp.Body).Decode(&shareResp)
		if len(shareResp.Code) != 6 {
			t.Errorf("code length = %d, want 6", len(shareResp.Code))
		}
		if !strings.HasPrefix(shareResp.URL, "/s/") {
			t.Errorf("URL = %q, want prefix /s/", shareResp.URL)
		}
	})

	t.Run("readonly access", func(t *testing.T) {
		database := newTestDB(t)
		database.EnsureWorkspace("ws1")
		handler := HandleShare(database)

		body := `{"workspaceId":"ws1","access":"readonly"}`
		req := httptest.NewRequest("POST", "/api/share", strings.NewReader(body))
		w := httptest.NewRecorder()

		handler(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
		}

		var shareResp models.ShareResponse
		json.NewDecoder(resp.Body).Decode(&shareResp)
		if len(shareResp.Code) != 6 {
			t.Errorf("code length = %d, want 6", len(shareResp.Code))
		}
	})

	t.Run("invalid access value", func(t *testing.T) {
		database := newTestDB(t)
		database.EnsureWorkspace("ws1")
		handler := HandleShare(database)

		body := `{"workspaceId":"ws1","access":"admin"}`
		req := httptest.NewRequest("POST", "/api/share", strings.NewReader(body))
		w := httptest.NewRecorder()

		handler(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusBadRequest)
		}
		var raw map[string]string
		json.NewDecoder(resp.Body).Decode(&raw)
		if raw["error"] == "" {
			t.Error("expected error message for invalid access")
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		database := newTestDB(t)
		handler := HandleShare(database)

		req := httptest.NewRequest("POST", "/api/share", strings.NewReader("not json"))
		w := httptest.NewRecorder()

		handler(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusBadRequest)
		}
	})
}

func TestHandleResolveShare(t *testing.T) {
	t.Run("found edit link", func(t *testing.T) {
		database := newTestDB(t)
		database.EnsureWorkspace("ws1")
		code, _ := database.CreateShareLink("ws1", "edit")

		r := chi.NewRouter()
		r.Get("/s/{code}", HandleResolveShare(database))

		req := httptest.NewRequest("GET", "/s/"+code, nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusFound {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusFound)
		}
		location := resp.Header.Get("Location")
		expected := "/space/ws1"
		if location != expected {
			t.Errorf("Location = %q, want %q", location, expected)
		}
	})

	t.Run("found readonly link", func(t *testing.T) {
		database := newTestDB(t)
		database.EnsureWorkspace("ws1")
		code, _ := database.CreateShareLink("ws1", "readonly")

		r := chi.NewRouter()
		r.Get("/s/{code}", HandleResolveShare(database))

		req := httptest.NewRequest("GET", "/s/"+code, nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusFound {
			t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusFound)
		}
		location := resp.Header.Get("Location")
		expected := "/space/ws1?access=readonly"
		if location != expected {
			t.Errorf("Location = %q, want %q", location, expected)
		}
	})

	t.Run("not found", func(t *testing.T) {
		database := newTestDB(t)

		r := chi.NewRouter()
		r.Get("/s/{code}", HandleResolveShare(database))

		req := httptest.NewRequest("GET", "/s/nonexistent", nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		// When not found, the handler tries to serve index.html as fallback.
		// Since the file doesn't exist in test, it will return 404.
		resp := w.Result()
		// We just verify it doesn't return a redirect.
		if resp.StatusCode == http.StatusFound {
			t.Error("should not redirect for non-existent share code")
		}
	})
}
