-- ==============================================================================
-- STEAV EGRESS CLEANUP — AUDIT & REMOVE BASE64 IMAGES FROM POSTGRESQL `products`
-- Run in Supabase Dashboard -> SQL Editor once your project is unlocked.
--
-- Recommended:
--   1. Run the AUDIT query below first to see which products have base64 blobs.
--   2. Either run `node scripts/migrateBase64ToStorage.mjs` (to move them to
--      Supabase Storage without losing images), OR run Step 2 below to clear them.
-- ==============================================================================

-- 1. AUDIT: Find products storing inline base64 images and their byte sizes
SELECT
  id,
  name,
  pg_column_size(image) AS image_bytes,
  pg_column_size(images) AS images_array_bytes,
  left(image, 40) AS image_preview
FROM public.products
WHERE
  (image IS NOT NULL AND image LIKE 'data:image/%')
  OR images::text LIKE '%data:image/%'
ORDER BY pg_column_size(images) DESC;

-- 2. OPTIONAL CLEANUP (Only if you want to immediately replace base64 blobs
--    with the default placeholder URL instead of migrating via Node script):
-- UPDATE public.products
-- SET
--   image = CASE
--     WHEN image LIKE 'data:image/%' THEN '/uploads/8a82fc7bb76c.jpg'
--     ELSE image
--   END,
--   images = ARRAY(
--     SELECT CASE
--       WHEN elem LIKE 'data:image/%' THEN '/uploads/8a82fc7bb76c.jpg'
--       ELSE elem
--     END
--     FROM unnest(coalesce(images, ARRAY[]::text[])) AS elem
--   )
-- WHERE image LIKE 'data:image/%' OR images::text LIKE '%data:image/%';
