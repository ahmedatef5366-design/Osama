// Package branding exposes the coach-facing branding singleton — display
// name, tagline, logo, accent colour, and public contact channels. The
// payload is always public because everything in it ends up on the
// public landing page; the *editor* is admin-only.
package branding

import "time"

// Branding is the JSON shape we hand back to every caller.
type Branding struct {
	CoachName      string    `json:"coachName"`
	TaglineAR      string    `json:"taglineAr"`
	TaglineEN      string    `json:"taglineEn"`
	LogoURL        string    `json:"logoUrl"`
	AccentColor    string    `json:"accentColor"`
	WhatsappNumber string    `json:"whatsappNumber"`
	SupportEmail   string    `json:"supportEmail"`
	InstagramURL   string    `json:"instagramUrl"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// UpdateRequest is what the admin PUTs to /api/admin/branding. Every
// field is optional so the editor can save partial changes; nil fields
// preserve the existing value.
type UpdateRequest struct {
	CoachName      *string `json:"coachName"`
	TaglineAR      *string `json:"taglineAr"`
	TaglineEN      *string `json:"taglineEn"`
	LogoURL        *string `json:"logoUrl"`
	AccentColor    *string `json:"accentColor"`
	WhatsappNumber *string `json:"whatsappNumber"`
	SupportEmail   *string `json:"supportEmail"`
	InstagramURL   *string `json:"instagramUrl"`
}
