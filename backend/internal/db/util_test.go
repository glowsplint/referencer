package db

import (
	"testing"
)

func TestGenerateCode(t *testing.T) {
	t.Run("correct length", func(t *testing.T) {
		for _, length := range []int{1, 6, 10, 20} {
			code := generateCode(length)
			if len(code) != length {
				t.Errorf("generateCode(%d) length = %d, want %d", length, len(code), length)
			}
		}
	})

	t.Run("valid characters", func(t *testing.T) {
		code := generateCode(100)
		for _, c := range code {
			found := false
			for _, ch := range charset {
				if c == ch {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("invalid character %q in generated code", c)
			}
		}
	})

	t.Run("randomness", func(t *testing.T) {
		codes := make(map[string]bool)
		for i := 0; i < 100; i++ {
			code := generateCode(6)
			if codes[code] {
				t.Errorf("duplicate code %q generated", code)
			}
			codes[code] = true
		}
	})
}
