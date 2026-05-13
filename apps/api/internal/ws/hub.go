package ws

import (
	"encoding/json"
	"sync"

	"github.com/google/uuid"
)

type MessageType string

const (
	TypeNotification   MessageType = "notification"
	TypeRestTimerStart MessageType = "rest_timer_start"
	TypeRestTimerSync  MessageType = "rest_timer_sync"
)

type WSMessage struct {
	Type MessageType     `json:"type"`
	Data json.RawMessage `json:"data"`
}

type Client struct {
	UserID uuid.UUID
	Send   chan []byte
}

type Hub struct {
	clients    map[uuid.UUID]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan BroadcastMsg
	mu         sync.RWMutex
}

type BroadcastMsg struct {
	UserID  uuid.UUID
	Payload []byte
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan BroadcastMsg, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			h.clients[c.UserID] = c
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c.UserID]; ok {
				close(c.Send)
				delete(h.clients, c.UserID)
			}
			h.mu.Unlock()
		case msg := <-h.broadcast:
			h.mu.RLock()
			if c, ok := h.clients[msg.UserID]; ok {
				select {
				case c.Send <- msg.Payload:
				default:
					// drop if buffer full
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Register(c *Client) {
	h.register <- c
}

func (h *Hub) Unregister(c *Client) {
	h.unregister <- c
}

func (h *Hub) SendToUser(userID uuid.UUID, msg WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.broadcast <- BroadcastMsg{UserID: userID, Payload: data}
}
