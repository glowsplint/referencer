package ws

import (
	"testing"
)

func TestAssertString(t *testing.T) {
	payload := map[string]interface{}{
		"name": "hello",
		"num":  42.0,
	}

	t.Run("success", func(t *testing.T) {
		v, err := assertString(payload, "name")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if v != "hello" {
			t.Fatalf("expected %q, got %q", "hello", v)
		}
	})

	t.Run("missing key", func(t *testing.T) {
		_, err := assertString(payload, "missing")
		if err == nil {
			t.Fatal("expected error for missing key")
		}
	})

	t.Run("wrong type", func(t *testing.T) {
		_, err := assertString(payload, "num")
		if err == nil {
			t.Fatal("expected error for wrong type")
		}
	})
}

func TestAssertFloat64(t *testing.T) {
	payload := map[string]interface{}{
		"value": 3.14,
		"name":  "test",
	}

	t.Run("success", func(t *testing.T) {
		v, err := assertFloat64(payload, "value")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if v != 3.14 {
			t.Fatalf("expected %f, got %f", 3.14, v)
		}
	})

	t.Run("missing key", func(t *testing.T) {
		_, err := assertFloat64(payload, "missing")
		if err == nil {
			t.Fatal("expected error for missing key")
		}
	})

	t.Run("wrong type", func(t *testing.T) {
		_, err := assertFloat64(payload, "name")
		if err == nil {
			t.Fatal("expected error for wrong type")
		}
	})
}

func TestAssertMap(t *testing.T) {
	inner := map[string]interface{}{"a": 1.0}
	payload := map[string]interface{}{
		"nested": inner,
		"name":   "test",
	}

	t.Run("success", func(t *testing.T) {
		v, err := assertMap(payload, "nested")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if v["a"] != 1.0 {
			t.Fatalf("expected nested map with a=1, got %v", v)
		}
	})

	t.Run("missing key", func(t *testing.T) {
		_, err := assertMap(payload, "missing")
		if err == nil {
			t.Fatal("expected error for missing key")
		}
	})

	t.Run("wrong type", func(t *testing.T) {
		_, err := assertMap(payload, "name")
		if err == nil {
			t.Fatal("expected error for wrong type")
		}
	})
}

func TestAssertSlice(t *testing.T) {
	payload := map[string]interface{}{
		"items": []interface{}{"a", "b", "c"},
		"name":  "test",
	}

	t.Run("success", func(t *testing.T) {
		v, err := assertSlice(payload, "items")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(v) != 3 {
			t.Fatalf("expected 3 items, got %d", len(v))
		}
	})

	t.Run("missing key", func(t *testing.T) {
		_, err := assertSlice(payload, "missing")
		if err == nil {
			t.Fatal("expected error for missing key")
		}
	})

	t.Run("wrong type", func(t *testing.T) {
		_, err := assertSlice(payload, "name")
		if err == nil {
			t.Fatal("expected error for wrong type")
		}
	})
}
