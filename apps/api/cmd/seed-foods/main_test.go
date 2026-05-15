package main

import (
	"strings"
	"testing"
)

func TestValidate(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name    string
		entry   foodEntry
		wantErr string // substring match; empty means "no error"
	}{
		{
			name: "valid chicken breast",
			entry: foodEntry{
				Name:            "Chicken breast",
				CaloriesPer100g: 165, ProteinPer100g: 31, CarbsPer100g: 0, FatPer100g: 3.6,
			},
		},
		{
			name: "valid water (all zeros)",
			entry: foodEntry{
				Name:            "Water",
				CaloriesPer100g: 0, ProteinPer100g: 0, CarbsPer100g: 0, FatPer100g: 0,
			},
		},
		{
			name: "valid lemon (fibre dominant carbs)",
			entry: foodEntry{
				Name:            "Lemon",
				CaloriesPer100g: 29, ProteinPer100g: 1.1, CarbsPer100g: 9.3, FatPer100g: 0.3,
				FiberPer100g: ptr(2.8),
			},
		},
		{
			name: "valid olive oil (fat only)",
			entry: foodEntry{
				Name:            "Olive oil",
				CaloriesPer100g: 884, ProteinPer100g: 0, CarbsPer100g: 0, FatPer100g: 100,
			},
		},
		{
			name:    "missing name",
			entry:   foodEntry{CaloriesPer100g: 100, ProteinPer100g: 10},
			wantErr: "name is required",
		},
		{
			name: "negative protein",
			entry: foodEntry{
				Name:            "Bad",
				CaloriesPer100g: 100, ProteinPer100g: -1,
			},
			wantErr: "macros must be non-negative",
		},
		{
			name: "calories massively wrong",
			entry: foodEntry{
				Name:            "Typo",
				CaloriesPer100g: 1000, ProteinPer100g: 5, CarbsPer100g: 5, FatPer100g: 5,
			},
			wantErr: "out of range",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validate(tc.entry)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("want no error, got %v", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("want error containing %q, got nil", tc.wantErr)
			}
			if !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("want error containing %q, got %v", tc.wantErr, err)
			}
		})
	}
}

func TestLoadAllParsesShippedSeed(t *testing.T) {
	// Smoke test: every YAML file we ship must parse cleanly and contain
	// the expected number of items. Catches accidental YAML breakage
	// (typos, duplicate keys, wrong indentation) at CI time.
	entries, err := loadAll([]string{
		"../../seed/foods/egyptian-foods.yaml",
		"../../seed/foods/egyptian-foods-extended.yaml",
	})
	if err != nil {
		t.Fatalf("loadAll: %v", err)
	}
	if got, want := len(entries), 500; got != want {
		t.Errorf("entries: got %d, want %d", got, want)
	}
	// Spot-check the first entry to make sure fields wire through correctly.
	if entries[0].Name == "" || entries[0].SourceID == nil || *entries[0].SourceID == "" {
		t.Errorf("first entry malformed: %+v", entries[0])
	}
	// Every entry must have a stable source_id so the seed is upsertable.
	seen := make(map[string]struct{}, len(entries))
	for i, e := range entries {
		if e.SourceID == nil || *e.SourceID == "" {
			t.Errorf("entry %d (%q) missing source_id", i+1, e.Name)
			continue
		}
		if _, dup := seen[*e.SourceID]; dup {
			t.Errorf("duplicate source_id %q", *e.SourceID)
		}
		seen[*e.SourceID] = struct{}{}
	}
}

func ptr[T any](v T) *T { return &v }
