# Food seed data

YAML files in this directory are bulk-loaded into `food_database` by the
`seed-foods` CLI (`make -C apps/api seed-foods`). Every YAML file is a
single list of food entries with the schema below.

## Entry schema

```yaml
- name: "Chicken breast, cooked"          # required, English
  name_ar: "صدور فراخ مطبوخة"             # optional, Arabic
  brand: "Tyson"                          # optional
  barcode: "0123456789012"                # optional, must be globally unique
  category: "poultry"                     # required-ish; one of the slugs below
  calories_per_100g: 165                  # required, kcal per 100 g edible
  protein_per_100g: 31.0                  # required, g per 100 g
  carbs_per_100g: 0.0                     # required, g per 100 g
  fat_per_100g: 3.6                       # required, g per 100 g
  fiber_per_100g: 0.0                     # optional, g per 100 g
  sugar_per_100g: 0.0                     # optional, g per 100 g
  saturated_fat_per_100g: 1.0             # optional, g per 100 g
  sodium_mg_per_100g: 74                  # optional, mg per 100 g
  serving_size_grams: 120                 # optional, default serving
  serving_label: "1 breast"               # optional, English
  serving_label_ar: "صدر واحد"            # optional, Arabic
  image_url: "https://..."                # optional
  source_id: "egy_food_001"               # required-ish for idempotent upsert
  locale_tags: ["eg", "ar", "global"]     # optional
```

- `source` is set globally per-file via the loader command (defaults to
  `manual_egyptian`).
- `(source, source_id)` is the upsert key — running the seed twice replaces
  the row instead of duplicating it. Pick a stable `source_id` and don't
  reuse it for a different food.

## Categories

Use one of the following slugs for `category` so the admin UI can filter:

| Slug | Description |
|------|-------------|
| `grain` | Rice, pasta, oats, wheat-based staples |
| `bread` | Aish baladi, shami, croissants, simit |
| `legume` | Beans, lentils, chickpeas |
| `vegetable` | Fresh and cooked vegetables |
| `fruit` | Fresh fruits, dried fruits |
| `dairy` | Milk, yoghurt, cheeses |
| `egg` | Eggs and egg dishes |
| `poultry` | Chicken, turkey, duck |
| `meat` | Beef, lamb, veal, liver, organ meats |
| `fish` | Fish and seafood |
| `dish` | Composite Egyptian dishes (koshary, mahshi, ...) |
| `sweet` | Desserts, halawa, kunafa |
| `drink` | Hot drinks, juices, soft drinks |
| `snack` | Crisps, chocolate bars, biscuits |
| `oil` | Cooking oils, butter, ghee, margarine |
| `condiment` | Tahini, sauces, dressings |
| `nut` | Nuts and seeds |
| `other` | Anything that doesn't fit above |

## Macro accuracy

- Base macros (energy, protein, carbs, fat) should be reasonable —
  `calories ≈ 4*protein + 4*carbs + 9*fat` within ~10%.
- For staple raw ingredients, prefer **USDA FoodData Central / SR Legacy**
  values (https://fdc.nal.usda.gov).
- For composite Egyptian dishes the macros are approximations of a
  typical homemade recipe; coaches can override per-client by creating
  variants.
