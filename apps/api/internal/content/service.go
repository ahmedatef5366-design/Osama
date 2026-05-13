package content

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// allowedSections is the canonical set of CMS keys. Locking the keyset to
// the seed migration means the admin editor can't accidentally introduce
// a typo'd section that the frontend doesn't know how to render.
var allowedSections = map[string]struct{}{
	"hero":            {},
	"features":        {},
	"transformations": {},
	"testimonials":    {},
	"pricing":         {},
	"faq":             {},
	"footer":          {},
}

// MaxContentBytes caps the JSONB payload at 64 KB. Realistically a section
// is < 4 KB, so this is "won't fit in a tweet of tweets" rather than a
// hot-path limit.
const MaxContentBytes = 64 * 1024

// HistoryCacheKey returns the Redis key for the section's hot read path.
func cacheKey(section string) string { return "site-content:" + section }

// CacheTTL is how long a fetched section sits in Redis. Generous because
// we DELete the key on every write.
const CacheTTL = time.Hour

// Service implements every CMS operation: read (cached), upsert (writes
// history + invalidates cache + triggers revalidation), list, rollback.
type Service struct {
	pool        *pgxpool.Pool
	queries     *db.Queries
	rdb         *redis.Client
	revalidator *Revalidator
}

// NewService constructs a Service. Either rdb or revalidator may be nil;
// the caller is expected to provide them in production.
func NewService(pool *pgxpool.Pool, queries *db.Queries, rdb *redis.Client, revalidator *Revalidator) *Service {
	return &Service{pool: pool, queries: queries, rdb: rdb, revalidator: revalidator}
}

// IsValidSection reports whether the given key is in the canonical set.
func IsValidSection(key string) bool {
	_, ok := allowedSections[key]
	return ok
}

// Get returns a single section. Cached for one hour; the cache miss path
// hits Postgres and back-fills.
func (s *Service) Get(ctx context.Context, key string) (Section, error) {
	key = strings.ToLower(strings.TrimSpace(key))
	if !IsValidSection(key) {
		return Section{}, httpx.NotFound("section_not_found", "unknown section")
	}

	if s.rdb != nil {
		if raw, err := s.rdb.Get(ctx, cacheKey(key)).Bytes(); err == nil && len(raw) > 0 {
			var cached Section
			if jsonErr := json.Unmarshal(raw, &cached); jsonErr == nil {
				return cached, nil
			}
		}
	}

	row, err := s.queries.GetSiteContent(ctx, key)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Section{}, httpx.NotFound("section_not_found", "section has not been written yet")
		}
		return Section{}, httpx.Internal("site_content_get_failed", err)
	}
	out := sectionFromGet(row)

	if s.rdb != nil {
		if raw, err := json.Marshal(out); err == nil {
			_ = s.rdb.Set(ctx, cacheKey(key), raw, CacheTTL).Err()
		}
	}
	return out, nil
}

// List returns every section. Admin-only — not cached because it's only
// loaded by the editor and the row count is tiny.
func (s *Service) List(ctx context.Context) ([]Section, error) {
	rows, err := s.queries.ListSiteContent(ctx)
	if err != nil {
		return nil, httpx.Internal("site_content_list_failed", err)
	}
	out := make([]Section, 0, len(rows))
	for _, r := range rows {
		out = append(out, sectionFromList(r))
	}
	return out, nil
}

// Upsert writes a new content payload, appends a history row, busts the
// cache, and asynchronously asks Next.js to revalidate the landing page.
// Everything happens in one DB transaction.
func (s *Service) Upsert(ctx context.Context, key string, req UpsertRequest, actorID string) (Section, error) {
	key = strings.ToLower(strings.TrimSpace(key))
	if !IsValidSection(key) {
		return Section{}, httpx.NotFound("section_not_found", "unknown section")
	}
	if err := validateContent(req.Content); err != nil {
		return Section{}, err
	}

	by, err := optionalUUID(actorID)
	if err != nil {
		return Section{}, httpx.BadRequest("invalid_actor", "could not parse actor id")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Section{}, httpx.Internal("tx_begin_failed", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	q := s.queries.WithTx(tx)
	row, err := q.UpsertSiteContent(ctx, db.UpsertSiteContentParams{
		SectionKey:  key,
		ContentJson: req.Content,
		UpdatedBy:   by,
	})
	if err != nil {
		return Section{}, httpx.Internal("site_content_upsert_failed", err)
	}
	if _, err := q.InsertSiteContentHistory(ctx, db.InsertSiteContentHistoryParams{
		SectionKey:  key,
		ContentJson: req.Content,
		SavedBy:     by,
	}); err != nil {
		return Section{}, httpx.Internal("site_content_history_failed", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Section{}, httpx.Internal("tx_commit_failed", err)
	}

	if s.rdb != nil {
		_ = s.rdb.Del(ctx, cacheKey(key)).Err()
	}
	if s.revalidator != nil {
		// Fire-and-forget. A 5s timeout protects against the web app being
		// down; we DON'T block the admin save on it.
		go s.revalidator.Revalidate(context.Background(), key)
	}

	return sectionFromUpsert(row), nil
}

// ListHistory returns paginated history rows for a section, newest first.
func (s *Service) ListHistory(ctx context.Context, key string, page, pageSize int) ([]HistoryEntry, int64, error) {
	key = strings.ToLower(strings.TrimSpace(key))
	if !IsValidSection(key) {
		return nil, 0, httpx.NotFound("section_not_found", "unknown section")
	}
	if page < 1 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}
	rows, err := s.queries.ListSiteContentHistory(ctx, db.ListSiteContentHistoryParams{
		SectionKey: key,
		Limit:      int32(pageSize),
		Offset:     int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, httpx.Internal("history_list_failed", err)
	}
	total, err := s.queries.CountSiteContentHistory(ctx, key)
	if err != nil {
		return nil, 0, httpx.Internal("history_count_failed", err)
	}
	out := make([]HistoryEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, historyFromDB(r))
	}
	return out, total, nil
}

// Rollback restores a section to a previous history snapshot and writes a
// fresh history row so the rollback itself is visible in the audit trail.
func (s *Service) Rollback(ctx context.Context, key string, historyID, actorID string) (Section, error) {
	key = strings.ToLower(strings.TrimSpace(key))
	if !IsValidSection(key) {
		return Section{}, httpx.NotFound("section_not_found", "unknown section")
	}
	hid, err := pgxutil.UUIDFromString(historyID)
	if err != nil {
		return Section{}, httpx.BadRequest("invalid_history_id", "historyId must be a UUID")
	}

	snapshot, err := s.queries.GetSiteContentHistory(ctx, hid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Section{}, httpx.NotFound("history_not_found", "history entry not found")
		}
		return Section{}, httpx.Internal("history_get_failed", err)
	}
	if snapshot.SectionKey != key {
		return Section{}, httpx.BadRequest("history_section_mismatch", "history entry does not belong to this section")
	}

	return s.Upsert(ctx, key, UpsertRequest{Content: snapshot.ContentJson}, actorID)
}

func validateContent(raw json.RawMessage) error {
	if len(raw) == 0 {
		return httpx.BadRequest("empty_content", "content is required")
	}
	if len(raw) > MaxContentBytes {
		return httpx.BadRequest("content_too_large", fmt.Sprintf("content exceeds %d bytes", MaxContentBytes))
	}
	// Must be syntactically valid JSON and either an object or array — never
	// a bare string or number, which would silently brick the renderer.
	var anyJSON any
	if err := json.Unmarshal(raw, &anyJSON); err != nil {
		return httpx.BadRequest("invalid_json", "content must be valid JSON")
	}
	switch anyJSON.(type) {
	case map[string]any, []any:
	default:
		return httpx.BadRequest("invalid_json_root", "content must be a JSON object or array")
	}
	return nil
}

func optionalUUID(s string) (pgtype.UUID, error) {
	if s == "" {
		return pgtype.UUID{Valid: false}, nil
	}
	return pgxutil.UUIDFromString(s)
}
