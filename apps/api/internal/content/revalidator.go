package content

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// Revalidator pings the Next.js /api/revalidate route whenever a CMS section
// is mutated. We hold the URL + shared secret on the value so handlers can
// remain ignorant of HTTP plumbing.
//
// A zero Revalidator (NewRevalidator with empty URL) is a no-op — useful in
// tests and in environments where the web app is on the same revalidation
// path as the API (e.g. self-hosted).
type Revalidator struct {
	url    string
	secret string
	client *http.Client
	log    *zap.Logger
}

// NewRevalidator constructs a revalidator. Pass an empty URL to disable.
func NewRevalidator(url, secret string, log *zap.Logger) *Revalidator {
	return &Revalidator{
		url:    url,
		secret: secret,
		client: &http.Client{Timeout: 5 * time.Second},
		log:    log,
	}
}

// Revalidate POSTs the section key to the web app's revalidate endpoint.
// Errors are logged at WARN — a stale landing page is a soft failure, never
// a hard one for the editor save.
func (r *Revalidator) Revalidate(ctx context.Context, sectionKey string) {
	if r == nil || r.url == "" {
		return
	}
	body, _ := json.Marshal(map[string]string{
		"section": sectionKey,
		"tag":     "site-content",
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.url, bytes.NewReader(body))
	if err != nil {
		r.warn("revalidate_request_build_failed", sectionKey, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	if r.secret != "" {
		req.Header.Set("X-Revalidate-Secret", r.secret)
	}
	resp, err := r.client.Do(req)
	if err != nil {
		r.warn("revalidate_call_failed", sectionKey, err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		r.warn("revalidate_non_2xx", sectionKey, fmt.Errorf("status %d", resp.StatusCode))
		return
	}
}

func (r *Revalidator) warn(event, section string, err error) {
	if r.log == nil {
		return
	}
	r.log.Warn(event,
		zap.String("section", section),
		zap.Error(errors.Unwrap(err)),
		zap.String("detail", err.Error()),
	)
}
