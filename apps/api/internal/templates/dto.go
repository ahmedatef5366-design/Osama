package templates

import "time"

// Template is a pre-canned WhatsApp follow-up the admin can fire at a
// client. Bodies contain mustache-style placeholders ({name}, {weight},
// {streak}, {days}, {date}) that the web layer fills in client-side
// before opening wa.me/<phone>?text=<encoded>.
type Template struct {
	ID        string    `json:"id"`
	Slug      string    `json:"slug"`
	Category  string    `json:"category"`
	LabelAR   string    `json:"labelAr"`
	LabelEN   string    `json:"labelEn"`
	BodyAR    string    `json:"bodyAr"`
	BodyEN    string    `json:"bodyEn"`
	SortOrder int       `json:"sortOrder"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CreateRequest struct {
	Slug      string `json:"slug"`
	Category  string `json:"category"`
	LabelAR   string `json:"labelAr"`
	LabelEN   string `json:"labelEn"`
	BodyAR    string `json:"bodyAr"`
	BodyEN    string `json:"bodyEn"`
	SortOrder int    `json:"sortOrder"`
	IsActive  *bool  `json:"isActive,omitempty"`
}

type UpdateRequest struct {
	Category  *string `json:"category,omitempty"`
	LabelAR   *string `json:"labelAr,omitempty"`
	LabelEN   *string `json:"labelEn,omitempty"`
	BodyAR    *string `json:"bodyAr,omitempty"`
	BodyEN    *string `json:"bodyEn,omitempty"`
	SortOrder *int    `json:"sortOrder,omitempty"`
	IsActive  *bool   `json:"isActive,omitempty"`
}
