-- Create storage bucket for crop images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for crop images
CREATE POLICY "Authenticated users can upload crop images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crop-images');

CREATE POLICY "Users can view their own crop images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'crop-images');

CREATE POLICY "Users can delete their own crop images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crop-images');