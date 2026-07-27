
CREATE POLICY "investor upload own kyc" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='investor-kyc' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "investor read own kyc" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='investor-kyc' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admin read kyc" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='investor-kyc' AND public.is_admin(auth.uid()));

CREATE POLICY "investor upload own evidence" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='payment-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "investor read own evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admin read evidence" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-evidence' AND public.is_admin(auth.uid()));
