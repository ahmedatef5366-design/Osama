// Package httpx contains transport-level helpers shared by every handler:
// the canonical { data, error, meta } envelope and a small APIError type
// that the global error handler knows how to format.
package httpx

import "github.com/gofiber/fiber/v2"

// Response is the canonical envelope for every API response.
type Response struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
	Code  string `json:"code,omitempty"`
	Meta  *Meta  `json:"meta,omitempty"`
}

type Meta struct {
	Total    int64 `json:"total,omitempty"`
	Page     int   `json:"page,omitempty"`
	PageSize int   `json:"pageSize,omitempty"`
}

// OK writes a 200 response with the supplied data.
func OK(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusOK).JSON(Response{Data: data})
}

// Created writes a 201 response with the supplied data.
func Created(c *fiber.Ctx, data any) error {
	return c.Status(fiber.StatusCreated).JSON(Response{Data: data})
}

// Paginated writes a 200 response with pagination metadata.
func Paginated(c *fiber.Ctx, data any, total int64, page, pageSize int) error {
	return c.Status(fiber.StatusOK).JSON(Response{
		Data: data,
		Meta: &Meta{Total: total, Page: page, PageSize: pageSize},
	})
}

// NoContent writes a 204.
func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}
