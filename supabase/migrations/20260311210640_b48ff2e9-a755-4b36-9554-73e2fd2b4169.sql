
ALTER TABLE public.blog_articles 
ADD COLUMN IF NOT EXISTS is_auto_generated boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS image_alt text DEFAULT '';

-- Table for auto-publish settings
CREATE TABLE IF NOT EXISTS public.blog_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog settings" ON public.blog_settings
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read blog settings" ON public.blog_settings
  FOR SELECT TO public
  USING (true);

-- Insert default settings
INSERT INTO public.blog_settings (setting_key, setting_value) VALUES
  ('auto_publish_enabled', 'true'),
  ('articles_per_day', '2'),
  ('review_mode', 'false')
ON CONFLICT (setting_key) DO NOTHING;
