-- Remove the seven CMS sections seeded by 0012_cms_more_sections.up.sql.
-- Any admin-modified rows are also removed (same trade-off as 0008_cms_seed.down.sql).
DELETE FROM site_content
WHERE section_key IN (
  'announcement',
  'banner',
  'valueProps',
  'beforeAfter',
  'featuredStories',
  'processSteps',
  'customerActivity'
);
