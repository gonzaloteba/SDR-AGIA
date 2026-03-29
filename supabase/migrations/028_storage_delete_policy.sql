-- Allow service role to delete photos from client-photos bucket
CREATE POLICY "Service role can delete photos"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'client-photos');
