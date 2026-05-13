# Multi-stage build for the Go API
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

# ─── Runtime ───
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /bin/server /bin/server

# Copy migrations if they exist
COPY --from=builder /app/internal/db/migrations /migrations

EXPOSE 8080

ENTRYPOINT ["/bin/server"]
