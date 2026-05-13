// Package content implements the CMS (site_content + site_content_history)
// endpoints used by the admin /cms editor and the public landing page.
//
// Storage is JSONB so each section keeps an opaque schema controlled by the
// frontend — the API never tries to "understand" the shape. That keeps the
// editor flexible: adding a new section type is a frontend-only change.
package content

import (
	"encoding/json"
	"time"

	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Section is the shape returned to clients (public or admin). The content
// field is intentionally a raw json.RawMessage so the API doesn't have to
// re-encode it on every read.
type Section struct {
	Key       string          `json:"key"`
	Content   json.RawMessage `json:"content"`
	UpdatedBy string          `json:"updatedBy,omitempty"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// HistoryEntry is one row of the section history list.
type HistoryEntry struct {
	ID      string          `json:"id"`
	Key     string          `json:"key"`
	Content json.RawMessage `json:"content"`
	SavedBy string          `json:"savedBy,omitempty"`
	SavedAt time.Time       `json:"savedAt"`
}

// UpsertRequest is the body for PUT /api/site-content/:section.
type UpsertRequest struct {
	Content json.RawMessage `json:"content"`
}

// RollbackRequest is the body for POST /api/site-content/:section/rollback.
type RollbackRequest struct {
	HistoryID string `json:"historyId"`
}

func sectionFromGet(r db.GetSiteContentRow) Section {
	out := Section{
		Key:       r.SectionKey,
		Content:   r.ContentJson,
		UpdatedBy: pgxutil.UUIDToString(r.UpdatedBy),
	}
	if r.UpdatedAt.Valid {
		out.UpdatedAt = r.UpdatedAt.Time
	}
	return out
}

func sectionFromList(r db.ListSiteContentRow) Section {
	out := Section{
		Key:       r.SectionKey,
		Content:   r.ContentJson,
		UpdatedBy: pgxutil.UUIDToString(r.UpdatedBy),
	}
	if r.UpdatedAt.Valid {
		out.UpdatedAt = r.UpdatedAt.Time
	}
	return out
}

func sectionFromUpsert(r db.UpsertSiteContentRow) Section {
	out := Section{
		Key:       r.SectionKey,
		Content:   r.ContentJson,
		UpdatedBy: pgxutil.UUIDToString(r.UpdatedBy),
	}
	if r.UpdatedAt.Valid {
		out.UpdatedAt = r.UpdatedAt.Time
	}
	return out
}

func historyFromDB(h db.SiteContentHistory) HistoryEntry {
	out := HistoryEntry{
		ID:      pgxutil.UUIDToString(h.ID),
		Key:     h.SectionKey,
		Content: h.ContentJson,
		SavedBy: pgxutil.UUIDToString(h.SavedBy),
	}
	if h.SavedAt.Valid {
		out.SavedAt = h.SavedAt.Time
	}
	return out
}
