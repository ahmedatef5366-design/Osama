// Package invites implements token-gated client onboarding. The admin
// creates an invite for a (name, email) pair; the API returns a one-time
// URL the trainee uses to set their password and create their account.
//
// Tokens are random_bytes(32). Only the SHA-256 hash is persisted —
// a DB leak hands the attacker nothing useful, since they can't
// reverse the hash back to a working URL.
package invites

import "time"

// Invite is the admin-facing JSON shape. Token plaintext is *only*
// included on the create response (see CreateResponse).
type Invite struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	Name       string     `json:"name"`
	Status     string     `json:"status"` // pending|accepted|revoked|expired
	InvitedBy  *string    `json:"invitedBy,omitempty"`
	ExpiresAt  time.Time  `json:"expiresAt"`
	AcceptedAt *time.Time `json:"acceptedAt,omitempty"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}

// CreateRequest — POST /api/admin/invites
type CreateRequest struct {
	Email          string `json:"email"`
	Name           string `json:"name"`
	ExpiresInHours *int   `json:"expiresInHours,omitempty"`
}

// CreateResponse includes the plaintext token + URL. This is the only
// time the token leaves the server — store it client-side or hand the
// URL straight to the trainee.
type CreateResponse struct {
	Invite Invite `json:"invite"`
	Token  string `json:"token"`
	URL    string `json:"url"`
}

// AcceptRequest — POST /api/invites/:token/accept (public)
type AcceptRequest struct {
	Password string `json:"password"`
}

// PublicInvite is the slim shape returned to the unauthenticated invitee
// when they hit /api/invites/:token. It deliberately omits the invite
// id, the invited_by uuid, and any timestamps that aren't relevant
// to the accept form.
type PublicInvite struct {
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	ExpiresAt time.Time `json:"expiresAt"`
}
