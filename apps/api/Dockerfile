# syntax=docker/dockerfile:1.6

# ─── build stage ────────────────────────────────────────────────────────────
# Builds the API binary and pulls down the golang-migrate CLI, which the
# runtime stage uses to apply migrations on startup. Pinned to the Go
# version declared in apps/api/go.mod's `toolchain` directive.
FROM golang:1.25-alpine AS build

RUN apk add --no-cache git ca-certificates

WORKDIR /src

# Cache dependencies before copying the full source.
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download

COPY apps/api/ ./

# Strip debug info to shave a couple MB off the final image.
ENV CGO_ENABLED=0
RUN go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# golang-migrate is needed to apply migrations during deploy. Building it
# here avoids shipping a Go toolchain in the runtime image.
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1

# ─── runtime stage ──────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tini bash

WORKDIR /app

COPY --from=build /out/server /app/server
COPY --from=build /go/bin/migrate /usr/local/bin/migrate
COPY apps/api/migrations /app/migrations
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh /app/server

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["/app/server"]
