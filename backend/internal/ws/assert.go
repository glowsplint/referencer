package ws

import "fmt"

// assertString extracts a string value from the payload at the given key.
func assertString(payload map[string]interface{}, key string) (string, error) {
	v, ok := payload[key]
	if !ok {
		return "", fmt.Errorf("key %q: missing", key)
	}
	s, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("key %q: expected string, got %T", key, v)
	}
	return s, nil
}

// assertFloat64 extracts a float64 value from the payload at the given key.
func assertFloat64(payload map[string]interface{}, key string) (float64, error) {
	v, ok := payload[key]
	if !ok {
		return 0, fmt.Errorf("key %q: missing", key)
	}
	f, ok := v.(float64)
	if !ok {
		return 0, fmt.Errorf("key %q: expected float64, got %T", key, v)
	}
	return f, nil
}

// assertMap extracts a map[string]interface{} value from the payload at the given key.
func assertMap(payload map[string]interface{}, key string) (map[string]interface{}, error) {
	v, ok := payload[key]
	if !ok {
		return nil, fmt.Errorf("key %q: missing", key)
	}
	m, ok := v.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("key %q: expected map, got %T", key, v)
	}
	return m, nil
}

// assertSlice extracts a []interface{} value from the payload at the given key.
func assertSlice(payload map[string]interface{}, key string) ([]interface{}, error) {
	v, ok := payload[key]
	if !ok {
		return nil, fmt.Errorf("key %q: missing", key)
	}
	s, ok := v.([]interface{})
	if !ok {
		return nil, fmt.Errorf("key %q: expected slice, got %T", key, v)
	}
	return s, nil
}
