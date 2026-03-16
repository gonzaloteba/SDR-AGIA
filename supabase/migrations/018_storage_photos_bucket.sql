-- Create a public storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read photos (public bucket)
CREATE POLICY "Public read access for client photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-photos');

-- Allow authenticated users and service role to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-photos');

-- Allow service role to upload (for webhooks)
CREATE POLICY "Service role can upload photos"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'client-photos');
