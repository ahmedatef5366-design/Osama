package content

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"go.uber.org/zap"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
)

func TestIsValidSection(t *testing.T) {
	t.Parallel()
	for _, key := range []string{"hero", "features", "pricing", "footer"} {
		if !IsValidSection(key) {
			t.Errorf("expected %q to be a valid section", key)
		}
	}
	for _, key := range []string{"", "Hero", "unknown", "../etc/passwd"} {
		if IsValidSection(key) {
			t.Errorf("expected %q to be rejected", key)
		}
	}
}

func TestValidateContent(t *testing.T) {
	t.Parallel()
	type tc struct {
		name    string
		body    string
		wantErr string
	}
	cases := []tc{
		{"empty", ``, "empty_content"},
		{"not_json", `not json at all`, "invalid_json"},
		{"bare_string", `"just a string"`, "invalid_json_root"},
		{"bare_number", `42`, "invalid_json_root"},
		{"valid_obj", `{"visible":true,"items":[]}`, ""},
		{"valid_arr", `[{"id":"a"},{"id":"b"}]`, ""},
		{"too_large", `{"x":"` + strings.Repeat("a", MaxContentBytes) + `"}`, "content_too_large"},
	}
	for _, c := range cases {
		c := c
		t.Run(c.name, func(t *testing.T) {
			t.Parallel()
			err := validateContent(json.RawMessage(c.body))
			if c.wantErr == "" {
				if err != nil {
					t.Fatalf("expected nil, got %v", err)
				}
				return
			}
			var apiErr *httpx.APIError
			if !errors.As(err, &apiErr) {
				t.Fatalf("expected APIError, got %T: %v", err, err)
			}
			if apiErr.Code != c.wantErr {
				t.Errorf("got code %q, want %q", apiErr.Code, c.wantErr)
			}
		})
	}
}

func TestRevalidatorDisabledIsNoOp(t *testing.T) {
	t.Parallel()
	r := NewRevalidator("", "", zap.NewNop())
	// Should never panic or hang regardless of args.
	r.Revalidate(context.Background(), "hero")
	// Also tolerate nil receiver — handlers may construct without one.
	var nilR *Revalidator
	nilR.Revalidate(context.Background(), "hero")
}

func TestRevalidatorPostsSecretAndBody(t *testing.T) {
	t.Parallel()
	var calls int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		atomic.AddInt64(&calls, 1)
		if got := req.Header.Get("X-Revalidate-Secret"); got != "s3cret" {
			t.Errorf("missing secret header, got %q", got)
		}
		var body map[string]string
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			t.Fatal(err)
		}
		if body["section"] != "hero" || body["tag"] != "site-content" {
			t.Errorf("unexpected body %+v", body)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	r := NewRevalidator(server.URL, "s3cret", zap.NewNop())
	r.Revalidate(context.Background(), "hero")

	if atomic.LoadInt64(&calls) != 1 {
		t.Errorf("expected exactly 1 revalidation call, got %d", calls)
	}
}
