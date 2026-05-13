package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const (
	bcryptCost = 12

	// bcryptMaxLen is the hard byte limit bcrypt operates on. Anything
	// past 72 bytes is silently truncated, so two distinct >72-byte
	// passwords that share the same first 72 bytes would otherwise be
	// indistinguishable. We reject them up-front instead of letting that
	// happen.
	bcryptMaxLen = 72
)

// ErrPasswordMismatch is returned by Verify when the password doesn't match.
var ErrPasswordMismatch = errors.New("password mismatch")

// ErrPasswordTooLong is returned when the supplied password exceeds the
// bcrypt 72-byte limit. The caller should surface a clear 400 to the
// user explaining the limit.
var ErrPasswordTooLong = errors.New("password too long")

// HashPassword runs bcrypt at the configured cost. Rejects inputs longer
// than 72 bytes so we don't silently truncate.
func HashPassword(plain string) (string, error) {
	if len(plain) > bcryptMaxLen {
		return "", ErrPasswordTooLong
	}
	h, err := bcrypt.GenerateFromPassword([]byte(plain), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

// VerifyPassword returns ErrPasswordMismatch when the hash doesn't match.
// Over-long passwords are treated as mismatches (rather than a distinct
// error) so the response shape stays identical for unauthenticated
// callers — leaking "your password was too long, here's the limit" would
// be a minor enumeration hint.
func VerifyPassword(hash, plain string) error {
	if len(plain) > bcryptMaxLen {
		return ErrPasswordMismatch
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return ErrPasswordMismatch
		}
		return err
	}
	return nil
}
