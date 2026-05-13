// Package pgxutil contains small adapters between the rest of the codebase
// and pgx's pgtype values. sqlc emits pgtype.UUID / pgtype.Numeric / etc.
// for nullable columns; the rest of the app prefers google/uuid, *float64,
// and so on.
package pgxutil

import (
	"fmt"
	"math/big"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// UUID converts a google/uuid.UUID into a non-null pgtype.UUID.
func UUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

// UUIDFromString parses a string into a non-null pgtype.UUID. Returns an
// error if the string is not a valid UUID.
func UUIDFromString(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid uuid: %w", err)
	}
	return UUID(id), nil
}

// UUIDToString renders a pgtype.UUID as a canonical string, or "" if null.
func UUIDToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

// NumericToFloat returns the float64 value of a pgtype.Numeric, or nil if
// the value is null or not finite.
func NumericToFloat(n pgtype.Numeric) *float64 {
	if !n.Valid || n.NaN || n.InfinityModifier != pgtype.Finite {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	v := f.Float64
	return &v
}

// FloatToNumeric builds a pgtype.Numeric from an optional float64.
func FloatToNumeric(f *float64) pgtype.Numeric {
	if f == nil {
		return pgtype.Numeric{Valid: false}
	}
	// Convert via string to avoid binary float imprecision.
	bf := new(big.Float).SetFloat64(*f)
	s := bf.Text('f', -1)
	n := pgtype.Numeric{}
	if err := n.Scan(s); err != nil {
		return pgtype.Numeric{Valid: false}
	}
	return n
}
