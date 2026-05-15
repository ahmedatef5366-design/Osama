// seed-foods bulk-loads YAML food definitions into the `food_database`
// table. It is intended for one-shot reproducible imports (e.g. the
// curated Egyptian dataset in apps/api/seed/foods/egyptian-foods.yaml).
//
// Usage:
//
//	DATABASE_URL=postgres://... go run ./cmd/seed-foods
//	DATABASE_URL=postgres://... go run ./cmd/seed-foods -dir ./seed/foods -source manual_egyptian
//	go run ./cmd/seed-foods -file ./seed/foods/egyptian-foods.yaml -dry-run
//
// Idempotency: rows are upserted by the (source, source_id) pair. Running
// the same file twice updates rows in place instead of duplicating them.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"gopkg.in/yaml.v3"
)

// foodEntry mirrors the YAML schema documented in apps/api/seed/foods/README.md.
// All optional fields are pointers so we can distinguish "0" from "absent"
// and store SQL NULL for the latter.
type foodEntry struct {
	Name                string   `yaml:"name"`
	NameAR              *string  `yaml:"name_ar"`
	Brand               *string  `yaml:"brand"`
	Barcode             *string  `yaml:"barcode"`
	Category            *string  `yaml:"category"`
	CaloriesPer100g     float64  `yaml:"calories_per_100g"`
	ProteinPer100g      float64  `yaml:"protein_per_100g"`
	CarbsPer100g        float64  `yaml:"carbs_per_100g"`
	FatPer100g          float64  `yaml:"fat_per_100g"`
	FiberPer100g        *float64 `yaml:"fiber_per_100g"`
	SugarPer100g        *float64 `yaml:"sugar_per_100g"`
	SaturatedFatPer100g *float64 `yaml:"saturated_fat_per_100g"`
	SodiumMgPer100g     *float64 `yaml:"sodium_mg_per_100g"`
	ServingSizeGrams    *float64 `yaml:"serving_size_grams"`
	ServingLabel        *string  `yaml:"serving_label"`
	ServingLabelAR      *string  `yaml:"serving_label_ar"`
	ImageURL            *string  `yaml:"image_url"`
	SourceID            *string  `yaml:"source_id"`
	LocaleTags          []string `yaml:"locale_tags"`
}

const upsertSQL = `
INSERT INTO food_database (
    name, name_ar, brand, barcode,
    calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
    fiber_per_100g, sugar_per_100g, saturated_fat_per_100g, sodium_mg_per_100g,
    serving_size_grams, serving_label, serving_label_ar,
    category, image_url, source, source_id, locale_tags,
    is_verified
) VALUES (
    $1, $2, $3, $4,
    $5, $6, $7, $8,
    $9, $10, $11, $12,
    $13, $14, $15,
    $16, $17, $18, $19, COALESCE($20::text[], '{}'::text[]),
    TRUE
)
ON CONFLICT (source, source_id) WHERE source IS NOT NULL AND source_id IS NOT NULL
DO UPDATE SET
    name                   = EXCLUDED.name,
    name_ar                = EXCLUDED.name_ar,
    brand                  = EXCLUDED.brand,
    barcode                = EXCLUDED.barcode,
    calories_per_100g      = EXCLUDED.calories_per_100g,
    protein_per_100g       = EXCLUDED.protein_per_100g,
    carbs_per_100g         = EXCLUDED.carbs_per_100g,
    fat_per_100g           = EXCLUDED.fat_per_100g,
    fiber_per_100g         = EXCLUDED.fiber_per_100g,
    sugar_per_100g         = EXCLUDED.sugar_per_100g,
    saturated_fat_per_100g = EXCLUDED.saturated_fat_per_100g,
    sodium_mg_per_100g     = EXCLUDED.sodium_mg_per_100g,
    serving_size_grams     = EXCLUDED.serving_size_grams,
    serving_label          = EXCLUDED.serving_label,
    serving_label_ar       = EXCLUDED.serving_label_ar,
    category               = EXCLUDED.category,
    image_url              = EXCLUDED.image_url,
    locale_tags            = EXCLUDED.locale_tags,
    is_verified            = EXCLUDED.is_verified
RETURNING (xmax = 0) AS inserted;
`

func main() {
	var (
		dirFlag    = flag.String("dir", "./seed/foods", "directory of YAML seed files to load (each *.yaml)")
		fileFlag   = flag.String("file", "", "load a single YAML file instead of an entire dir")
		sourceFlag = flag.String("source", "manual_egyptian", "value to store in food_database.source")
		dryRun     = flag.Bool("dry-run", false, "parse and validate only — do not write to the DB")
	)
	flag.Parse()

	files, err := collectFiles(*fileFlag, *dirFlag)
	if err != nil {
		exitf("collect files: %v", err)
	}
	if len(files) == 0 {
		exitf("no .yaml files found (dir=%q file=%q)", *dirFlag, *fileFlag)
	}

	entries, err := loadAll(files)
	if err != nil {
		exitf("load yaml: %v", err)
	}
	fmt.Printf("parsed %d food entries from %d file(s)\n", len(entries), len(files))

	if *dryRun {
		fmt.Println("dry-run: skipping database writes")
		return
	}

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		exitf("DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		exitf("connect db: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		exitf("ping db: %v", err)
	}

	inserted, updated, err := upsertAll(ctx, pool, entries, *sourceFlag)
	if err != nil {
		exitf("upsert: %v", err)
	}
	fmt.Printf("done: %d inserted, %d updated, %d total\n", inserted, updated, inserted+updated)
}

// collectFiles returns the list of YAML files to process. -file overrides
// -dir; otherwise we walk -dir and pick up every .yaml/.yml entry that
// isn't a directory or README.
func collectFiles(file, dir string) ([]string, error) {
	if file != "" {
		return []string{file}, nil
	}
	var out []string
	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(d.Name()))
		if ext != ".yaml" && ext != ".yml" {
			return nil
		}
		out = append(out, path)
		return nil
	})
	if err != nil && !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}
	return out, nil
}

// loadAll parses every file into entries and validates each one. We bail
// on the first invalid entry so the operator sees the problem instead of
// silently importing partial data.
func loadAll(files []string) ([]foodEntry, error) {
	var all []foodEntry
	for _, f := range files {
		raw, err := os.ReadFile(f)
		if err != nil {
			return nil, fmt.Errorf("read %s: %w", f, err)
		}
		var batch []foodEntry
		if err := yaml.Unmarshal(raw, &batch); err != nil {
			return nil, fmt.Errorf("parse %s: %w", f, err)
		}
		for i, e := range batch {
			if err := validate(e); err != nil {
				return nil, fmt.Errorf("%s entry #%d (%q): %w", f, i+1, e.Name, err)
			}
		}
		all = append(all, batch...)
	}
	return all, nil
}

func validate(e foodEntry) error {
	if strings.TrimSpace(e.Name) == "" {
		return errors.New("name is required")
	}
	if e.CaloriesPer100g < 0 || e.ProteinPer100g < 0 || e.CarbsPer100g < 0 || e.FatPer100g < 0 {
		return errors.New("macros must be non-negative")
	}
	// Sanity check: kcal ≈ 4*(P+net carbs) + 9*F within a wide tolerance.
	// Net carbs subtracts fiber because most fibre passes undigested
	// (Atwater factors mark insoluble fibre as ~0 kcal/g). The tolerance
	// is intentionally loose — it only catches gross typos like swapping
	// protein with carbs, not fine-grained recipe variation.
	netCarbs := e.CarbsPer100g
	if e.FiberPer100g != nil {
		netCarbs -= *e.FiberPer100g
		if netCarbs < 0 {
			netCarbs = 0
		}
	}
	derived := 4*e.ProteinPer100g + 4*netCarbs + 9*e.FatPer100g
	if e.CaloriesPer100g >= 10 && derived >= 10 {
		ratio := e.CaloriesPer100g / derived
		if ratio < 0.5 || ratio > 1.6 {
			return fmt.Errorf("calories %.0f kcal/100g out of range vs macros (derived %.0f kcal)", e.CaloriesPer100g, derived)
		}
	}
	return nil
}

func upsertAll(ctx context.Context, pool *pgxpool.Pool, entries []foodEntry, source string) (inserted, updated int, err error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	for i, e := range entries {
		var sourceID any
		if e.SourceID != nil && *e.SourceID != "" {
			sourceID = *e.SourceID
		}

		var didInsert bool
		err := tx.QueryRow(ctx, upsertSQL,
			e.Name, ptrString(e.NameAR), ptrString(e.Brand), ptrString(e.Barcode),
			e.CaloriesPer100g, e.ProteinPer100g, e.CarbsPer100g, e.FatPer100g,
			ptrFloat(e.FiberPer100g), ptrFloat(e.SugarPer100g),
			ptrFloat(e.SaturatedFatPer100g), ptrFloat(e.SodiumMgPer100g),
			ptrFloat(e.ServingSizeGrams), ptrString(e.ServingLabel), ptrString(e.ServingLabelAR),
			ptrString(e.Category), ptrString(e.ImageURL),
			source, sourceID, e.LocaleTags,
		).Scan(&didInsert)
		if err != nil {
			return 0, 0, fmt.Errorf("entry #%d (%q): %w", i+1, e.Name, err)
		}
		if didInsert {
			inserted++
		} else {
			updated++
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, 0, fmt.Errorf("commit: %w", err)
	}
	return inserted, updated, nil
}

func ptrString(p *string) any {
	if p == nil {
		return nil
	}
	return *p
}

func ptrFloat(p *float64) any {
	if p == nil {
		return nil
	}
	return *p
}

func exitf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "seed-foods: "+format+"\n", args...)
	os.Exit(1)
}
