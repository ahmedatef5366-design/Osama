package httpx

import (
	"errors"
	"fmt"
	"net/http"
)

// APIError is the structured error type handlers should return when they
// want to control the HTTP status, machine-readable code, and the message
// rendered to the client. Anything else is treated as a 500.
type APIError struct {
	Status  int               // HTTP status code
	Code    string            // stable machine-readable string, e.g. "client_not_found"
	Message string            // safe-to-show-to-user message
	Cause   error             // wrapped underlying error (logged but never serialised)
	Headers map[string]string // optional headers to set on the error response (e.g. Retry-After)
}

func (e *APIError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *APIError) Unwrap() error { return e.Cause }

// As returns the APIError if err is or wraps one.
func As(err error) (*APIError, bool) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		return apiErr, true
	}
	return nil, false
}

// Common, type-safe constructors. Use these from services/handlers.

func BadRequest(code, msg string) *APIError {
	return &APIError{Status: http.StatusBadRequest, Code: code, Message: msg}
}

func Unauthorized(code, msg string) *APIError {
	return &APIError{Status: http.StatusUnauthorized, Code: code, Message: msg}
}

func Forbidden(code, msg string) *APIError {
	return &APIError{Status: http.StatusForbidden, Code: code, Message: msg}
}

func NotFound(code, msg string) *APIError {
	return &APIError{Status: http.StatusNotFound, Code: code, Message: msg}
}

func Conflict(code, msg string) *APIError {
	return &APIError{Status: http.StatusConflict, Code: code, Message: msg}
}

func Internal(code string, cause error) *APIError {
	return &APIError{
		Status:  http.StatusInternalServerError,
		Code:    code,
		Message: "internal server error",
		Cause:   cause,
	}
}

// TooManyRequests builds a 429 error with an optional Retry-After value
// (in seconds). retryAfterSeconds <= 0 omits the header.
func TooManyRequests(code, msg string, retryAfterSeconds int) *APIError {
	err := &APIError{Status: http.StatusTooManyRequests, Code: code, Message: msg}
	if retryAfterSeconds > 0 {
		err.Headers = map[string]string{
			"Retry-After": itoa(retryAfterSeconds),
		}
	}
	return err
}

func itoa(n int) string {
	return fmt.Sprintf("%d", n)
}
