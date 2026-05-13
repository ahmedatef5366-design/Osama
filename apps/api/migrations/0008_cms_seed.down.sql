-- Remove the canonical CMS sections inserted by 0008_cms_seed.up.sql.
-- Any admin-modified rows are also removed, because there's no way to
-- distinguish an "unedited seed" from "edited by admin" once stored.
DELETE FROM site_content
WHERE section_key IN ('hero', 'features', 'transformations', 'testimonials', 'pricing', 'faq', 'footer');
