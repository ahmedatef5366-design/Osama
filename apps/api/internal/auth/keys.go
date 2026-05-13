package auth

import (
	"crypto/rsa"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// LoadKeys reads the RS256 keypair from disk. Both files must exist and
// must be PEM-encoded.
func LoadKeys(privatePath, publicPath string) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privPEM, err := os.ReadFile(privatePath)
	if err != nil {
		return nil, nil, fmt.Errorf("read jwt private key: %w", err)
	}
	priv, err := jwt.ParseRSAPrivateKeyFromPEM(privPEM)
	if err != nil {
		return nil, nil, fmt.Errorf("parse jwt private key: %w", err)
	}

	pubPEM, err := os.ReadFile(publicPath)
	if err != nil {
		return nil, nil, fmt.Errorf("read jwt public key: %w", err)
	}
	pub, err := jwt.ParseRSAPublicKeyFromPEM(pubPEM)
	if err != nil {
		return nil, nil, fmt.Errorf("parse jwt public key: %w", err)
	}
	return priv, pub, nil
}
