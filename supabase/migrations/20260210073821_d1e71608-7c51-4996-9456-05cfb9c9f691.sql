
-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Only admins can manage invoice files
CREATE POLICY "Admins can manage invoice files"
ON storage.objects
FOR ALL
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can view/download invoice files (for clients to download their own)
CREATE POLICY "Authenticated users can view invoice files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');
