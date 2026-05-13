// Package access centralizes the authorization helpers that translate
// the authenticated identity (user_id + role on Locals) into the
// authoritative resource identifiers downstream handlers operate on.
//
// In particular, [Resolver.ClientID] is the single source of truth for
// the *client* UUID associated with a request — clients never get to
// supply one (the JWT is authoritative), and admins must explicitly
// provide one that points at an existing client row.
package access

import (
	"context"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/ahmedatef5366-design/Osama/apps/api/internal/auth"
	db "github.com/ahmedatef5366-design/Osama/apps/api/internal/db/generated"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/httpx"
	"github.com/ahmedatef5366-design/Osama/apps/api/internal/pgxutil"
)

// Resolver looks up authorization-relevant identifiers from the request
// context. Held as a value because it carries the queries handle.
type Resolver struct {
	queries *db.Queries
}

// NewResolver constructs a Resolver bound to the supplied queries.
func NewResolver(q *db.Queries) *Resolver { return &Resolver{queries: q} }

// ClientID returns the authoritative client UUID for the caller.
//
//   - For a client-role caller: the client row is looked up by the user_id
//     embedded in the JWT. Any clientId supplied by the request is ignored
//     so a client can never reach another client's data through query/path
//     manipulation.
//   - For an admin-role caller: the clientId MUST be supplied via path
//     param or query string. The referenced client must exist; otherwise
//     a 404 is returned.
//
// Returns 404 if a client caller has no client row yet (profile not
// created) and 400/401 for the obvious shape errors. The error returned
// is already an *httpx.APIError, so handlers can `return err` directly.
func (r *Resolver) ClientID(c *fiber.Ctx) (pgtype.UUID, error) {
	userIDStr, _ := c.Locals(auth.LocalsUserID).(string)
	if userIDStr == "" {
		return pgtype.UUID{}, httpx.Unauthorized("missing_user", "missing user")
	}
	role, _ := c.Locals(auth.LocalsUserRole).(string)

	if role == string(auth.RoleAdmin) {
		return r.adminClientID(c)
	}

	uid, err := pgxutil.UUIDFromString(userIDStr)
	if err != nil {
		return pgtype.UUID{}, httpx.Unauthorized("invalid_user", "invalid user")
	}
	return r.clientByUser(c.UserContext(), uid)
}

// adminClientID resolves the clientId an admin caller is targeting from
// the request and verifies it points at a real client row.
func (r *Resolver) adminClientID(c *fiber.Ctx) (pgtype.UUID, error) {
	reqID := c.Params("clientId")
	if reqID == "" {
		reqID = c.Query("clientId")
	}
	if reqID == "" {
		return pgtype.UUID{}, httpx.BadRequest("missing_client_id", "clientId is required")
	}
	cid, err := pgxutil.UUIDFromString(reqID)
	if err != nil {
		return pgtype.UUID{}, httpx.BadRequest("invalid_client_id", "clientId must be a UUID")
	}
	if _, err := r.queries.GetClient(c.UserContext(), cid); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, httpx.NotFound("client_not_found", "client not found")
		}
		return pgtype.UUID{}, httpx.Internal("client_lookup_failed", err)
	}
	return cid, nil
}

// clientByUser fetches the client row associated with the authenticated
// user. We never trust any user-supplied clientId for client callers.
func (r *Resolver) clientByUser(ctx context.Context, userID pgtype.UUID) (pgtype.UUID, error) {
	cl, err := r.queries.GetClientByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, httpx.NotFound("client_not_found", "client profile has not been created yet")
		}
		return pgtype.UUID{}, httpx.Internal("client_lookup_failed", err)
	}
	return cl.ID, nil
}
