package subscriptions

import "time"

// LocalizedString mirrors the {ar, en} JSONB blobs used elsewhere
// (CMS, plans.name, plans.features.*).
type LocalizedString struct {
	AR string `json:"ar"`
	EN string `json:"en"`
}

type PlanFeature struct {
	AR string `json:"ar"`
	EN string `json:"en"`
}

type Plan struct {
	ID              string           `json:"id"`
	Slug            string           `json:"slug"`
	Name            LocalizedString  `json:"name"`
	Description     *LocalizedString `json:"description,omitempty"`
	MonthlyPriceEGP int              `json:"monthlyPriceEgp"`
	Features        []PlanFeature    `json:"features"`
	MaxClients      int              `json:"maxClients"`
	SortOrder       int              `json:"sortOrder"`
	IsActive        bool             `json:"isActive"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
}

type Subscription struct {
	ID           string          `json:"id"`
	ClientID     string          `json:"clientId"`
	PlanID       string          `json:"planId"`
	PlanSlug     string          `json:"planSlug"`
	PlanName     LocalizedString `json:"planName"`
	Status       string          `json:"status"` // trial | active | expired | canceled
	StartedAt    time.Time       `json:"startedAt"`
	ExpiresAt    *time.Time      `json:"expiresAt,omitempty"`
	TrialUntil   *time.Time      `json:"trialUntil,omitempty"`
	CancelReason *string         `json:"cancelReason,omitempty"`
	Notes        *string         `json:"notes,omitempty"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

// SubscriptionWithClient enriches Subscription with the client's name
// and email for the admin list view.
type SubscriptionWithClient struct {
	Subscription
	ClientName  string `json:"clientName"`
	ClientEmail string `json:"clientEmail"`
}

// UpsertRequest is the body of POST /api/admin/subscriptions. Either
// planSlug or planId may be supplied; planSlug wins when both are set.
type UpsertRequest struct {
	ClientID   string  `json:"clientId"`
	PlanID     *string `json:"planId,omitempty"`
	PlanSlug   *string `json:"planSlug,omitempty"`
	Status     *string `json:"status,omitempty"`
	ExpiresAt  *string `json:"expiresAt,omitempty"`  // ISO-8601 or null
	TrialUntil *string `json:"trialUntil,omitempty"` // ISO-8601 or null
	Notes      *string `json:"notes,omitempty"`
}

type CancelRequest struct {
	Reason *string `json:"reason,omitempty"`
}

type HistoryEntry struct {
	ID        string     `json:"id"`
	ClientID  string     `json:"clientId"`
	PlanID    string     `json:"planId"`
	PlanSlug  string     `json:"planSlug"`
	Status    string     `json:"status"`
	StartedAt time.Time  `json:"startedAt"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	ChangedBy *string    `json:"changedBy,omitempty"`
	ChangedAt time.Time  `json:"changedAt"`
	Note      *string    `json:"note,omitempty"`
}
