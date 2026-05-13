package auth

import (
	"errors"
	"testing"
)

func TestPasswordRoundTrip(t *testing.T) {
	const plain = "correct horse battery staple"
	hash, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if hash == "" {
		t.Fatal("hash is empty")
	}
	if hash == plain {
		t.Fatal("hash equals plaintext")
	}
	if err := VerifyPassword(hash, plain); err != nil {
		t.Fatalf("VerifyPassword (correct): %v", err)
	}
	err = VerifyPassword(hash, "wrong password")
	if !errors.Is(err, ErrPasswordMismatch) {
		t.Fatalf("VerifyPassword (wrong) error = %v, want ErrPasswordMismatch", err)
	}
}

func TestVerifyPasswordRejectsGarbageHash(t *testing.T) {
	err := VerifyPassword("not-a-bcrypt-hash", "anything")
	if err == nil {
		t.Fatal("expected error from garbage hash")
	}
	if errors.Is(err, ErrPasswordMismatch) {
		t.Fatalf("garbage hash should not be reported as mismatch; got %v", err)
	}
}
