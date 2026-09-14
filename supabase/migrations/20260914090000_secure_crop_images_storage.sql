-- Restrict crop-images storage to owner-prefixed object paths.
-- Clients upload as `{auth.uid()}/...` (scanner, upload, chat, bug reports).

UPDATE storage.buckets
SET public = false
WHERE id = 'crop-images';

DROP POLICY IF EXISTS "Authenticated users can upload crop images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own crop images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own crop images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view crop images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view crop images" ON storage.objects;

CREATE POLICY "Users can upload own crop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own crop images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own crop images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own crop images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'crop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role continues to bypass RLS for trusted backends.
