package ws

import (
	"bufio"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
)

// SSENotifications serves an SSE stream for real-time notifications.
func (h *Hub) SSENotifications(c *fiber.Ctx) error {
	userIDStr, _ := c.Locals(auth.LocalsUserID).(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return fiber.ErrBadRequest
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	client := &Client{
		UserID: userID,
		Send:   make(chan []byte, 64),
	}
	h.Register(client)

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		defer h.Unregister(client)

		for {
			select {
			case msg, ok := <-client.Send:
				if !ok {
					return
				}
				fmt.Fprintf(w, "data: %s\n\n", msg)
				if err := w.Flush(); err != nil {
					return
				}
			case <-ticker.C:
				fmt.Fprintf(w, ": ping\n\n")
				if err := w.Flush(); err != nil {
					return
				}
			}
		}
	})
	return nil
}
