package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"testing"
)

func TestParseKeysRoundTrip(t *testing.T) {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}

	privPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(priv),
	})
	pubBytes, err := x509.MarshalPKIXPublicKey(&priv.PublicKey)
	if err != nil {
		t.Fatalf("marshal public key: %v", err)
	}
	pubPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubBytes,
	})

	parsedPriv, parsedPub, err := ParseKeys(privPEM, pubPEM)
	if err != nil {
		t.Fatalf("ParseKeys: %v", err)
	}
	if parsedPriv.N.Cmp(priv.N) != 0 {
		t.Fatal("parsed private key modulus mismatch")
	}
	if parsedPub.N.Cmp(priv.PublicKey.N) != 0 {
		t.Fatal("parsed public key modulus mismatch")
	}
}

func TestParseKeysRejectsInvalidPEM(t *testing.T) {
	_, _, err := ParseKeys([]byte("not a pem"), []byte("also not a pem"))
	if err == nil {
		t.Fatal("expected error for invalid PEM, got nil")
	}
}
