package messaging

import "time"

type Message struct {
	ID         string     `json:"id"`
	FromUserID string     `json:"fromUserId"`
	ToUserID   string     `json:"toUserId"`
	Content    string     `json:"content"`
	ReadAt     *time.Time `json:"readAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}

type SendMessageRequest struct {
	ToUserID string `json:"toUserId"`
	Content  string `json:"content"`
}

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      *string   `json:"body,omitempty"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}
