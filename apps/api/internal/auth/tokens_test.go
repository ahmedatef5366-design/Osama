package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"testing"
	"time"

	"github.com/google/uuid"
)

func newTestKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	t.Helper()
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("rsa.GenerateKey: %v", err)
	}
	return priv, &priv.PublicKey
}

func TestAccessTokenRoundTrip(t *testing.T) {
	priv, pub := newTestKeys(t)
	tm := NewTokenManager(priv, pub, "test-issuer", 5*time.Minute, time.Hour, nil)

	uid := uuid.New()
	tok, exp, err := tm.IssueAccess(uid, RoleAdmin)
	if err != nil {
		t.Fatalf("IssueAccess: %v", err)
	}
	if tok == "" {
		t.Fatal("empty token")
	}
	if exp.Before(time.Now()) {
		t.Fatalf("expiration in the past: %v", exp)
	}

	claims, err := tm.ParseAccess(tok)
	if err != nil {
		t.Fatalf("ParseAccess: %v", err)
	}
	if claims.UserID != uid {
		t.Fatalf("claims.UserID = %v, want %v", claims.UserID, uid)
	}
	if claims.Role != RoleAdmin {
		t.Fatalf("claims.Role = %v, want %v", claims.Role, RoleAdmin)
	}
	if claims.Issuer != "test-issuer" {
		t.Fatalf("claims.Issuer = %q, want %q", claims.Issuer, "test-issuer")
	}
}

func TestParseAccessRejectsWrongIssuer(t *testing.T) {
	priv, pub := newTestKeys(t)
	signer := NewTokenManager(priv, pub, "issuer-a", time.Minute, time.Hour, nil)
	verifier := NewTokenManager(priv, pub, "issuer-b", time.Minute, time.Hour, nil)

	tok, _, err := signer.IssueAccess(uuid.New(), RoleClient)
	if err != nil {
		t.Fatalf("IssueAccess: %v", err)
	}
	if _, err := verifier.ParseAccess(tok); err == nil {
		t.Fatal("expected ParseAccess to reject mismatched issuer")
	}
}

func TestParseAccessRejectsExpired(t *testing.T) {
	priv, pub := newTestKeys(t)
	// Negative TTL => already-expired token.
	tm := NewTokenManager(priv, pub, "iss", -1*time.Second, time.Hour, nil)
	tok, _, err := tm.IssueAccess(uuid.New(), RoleClient)
	if err != nil {
		t.Fatalf("IssueAccess: %v", err)
	}
	if _, err := tm.ParseAccess(tok); err == nil {
		t.Fatal("expected ParseAccess to reject expired token")
	}
}
