-- Make tokenized_properties the shared catalogue record for the public site,
-- client portal, affiliate portal and admin. Presentation fields are optional
-- so the existing six properties can continue using their richer code fallback
-- until an admin edits and saves them.

ALTER TABLE public.tokenized_properties
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS public_tag TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS price_label TEXT,
  ADD COLUMN IF NOT EXISTS price_note TEXT,
  ADD COLUMN IF NOT EXISTS highlight TEXT,
  ADD COLUMN IF NOT EXISTS features TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS overview TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS public_property_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS investment_models TEXT[] NOT NULL DEFAULT ARRAY['full_purchase']::text[],
  ADD COLUMN IF NOT EXISTS public_funding_status TEXT NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS home_order INTEGER NOT NULL DEFAULT 100;

CREATE UNIQUE INDEX IF NOT EXISTS tokenized_properties_public_slug_key
ON public.tokenized_properties (public_slug)
WHERE public_slug IS NOT NULL;

ALTER TABLE public.tokenized_properties
  DROP CONSTRAINT IF EXISTS tokenized_properties_public_funding_status_check;
ALTER TABLE public.tokenized_properties
  ADD CONSTRAINT tokenized_properties_public_funding_status_check
  CHECK (public_funding_status IN ('available','selling','funding_open','fully_funded','coming_soon'));

UPDATE public.tokenized_properties
SET
  public_slug = CASE name
    WHEN 'Dream House in Guzape' THEN 'guzape-dream-homes'
    WHEN 'Ruby''s Apartment' THEN 'rubys-apartment-jahi'
    WHEN 'Lillycrest Luxury Terrace' THEN 'lillycrest-terrace-lifecamp'
    WHEN 'Lillycrest Residence' THEN 'lillycrest-residence-karsana'
    WHEN 'Estate Plots — Phase II' THEN 'estate-plots-phase-ii'
    WHEN 'Daverek Luxury Apartments' THEN 'daverek-luxury-apartments-katampe'
    ELSE public_slug
  END,
  public_tag = COALESCE(public_tag, CASE name
    WHEN 'Dream House in Guzape' THEN 'Move-in Ready'
    WHEN 'Ruby''s Apartment' THEN 'Available'
    WHEN 'Lillycrest Luxury Terrace' THEN 'Selling'
    WHEN 'Lillycrest Residence' THEN 'Multiple Units'
    WHEN 'Estate Plots — Phase II' THEN 'Land'
    WHEN 'Daverek Luxury Apartments' THEN 'New'
    ELSE 'Available'
  END),
  public_funding_status = CASE name
    WHEN 'Ruby''s Apartment' THEN 'funding_open'
    WHEN 'Lillycrest Luxury Terrace' THEN 'selling'
    WHEN 'Lillycrest Residence' THEN 'selling'
    ELSE public_funding_status
  END,
  home_order = CASE name
    WHEN 'Dream House in Guzape' THEN 10
    WHEN 'Ruby''s Apartment' THEN 20
    WHEN 'Lillycrest Luxury Terrace' THEN 30
    WHEN 'Lillycrest Residence' THEN 40
    WHEN 'Estate Plots — Phase II' THEN 50
    WHEN 'Daverek Luxury Apartments' THEN 60
    ELSE home_order
  END
WHERE name IN (
  'Dream House in Guzape',
  'Ruby''s Apartment',
  'Lillycrest Luxury Terrace',
  'Lillycrest Residence',
  'Estate Plots — Phase II',
  'Daverek Luxury Apartments'
);

ALTER TABLE public.available_properties
  ADD COLUMN IF NOT EXISTS catalogue_property_id UUID
  REFERENCES public.tokenized_properties(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS available_properties_catalogue_property_id_key
ON public.available_properties (catalogue_property_id);

UPDATE public.available_properties available
SET catalogue_property_id = catalogue.id
FROM public.tokenized_properties catalogue
WHERE available.catalogue_property_id IS NULL
  AND lower(available.property_name) = lower(catalogue.name)
  AND available.id = (
    SELECT candidate.id
    FROM public.available_properties candidate
    WHERE lower(candidate.property_name) = lower(catalogue.name)
    ORDER BY candidate.created_at, candidate.id
    LIMIT 1
  );

CREATE OR REPLACE FUNCTION public.sync_shared_property_catalogue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unit_labels TEXT[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.available_properties
    WHERE catalogue_property_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT COALESCE(array_agg(unit->>'label') FILTER (WHERE unit->>'label' IS NOT NULL), ARRAY[]::text[])
  INTO unit_labels
  FROM jsonb_array_elements(COALESCE(NEW.public_units, '[]'::jsonb)) AS unit;

  IF COALESCE(array_length(unit_labels, 1), 0) = 0 THEN
    unit_labels := CASE
      WHEN COALESCE(array_length(NEW.public_property_types, 1), 0) > 0
        THEN NEW.public_property_types
      WHEN NEW.property_type IS NOT NULL
        THEN ARRAY[NEW.property_type]
      ELSE ARRAY[]::text[]
    END;
  END IF;

  INSERT INTO public.available_properties (
    catalogue_property_id,
    property_name,
    location,
    plot_sizes,
    price_range_min,
    price_range_max,
    description,
    is_active
  ) VALUES (
    NEW.id,
    NEW.name,
    NEW.location,
    unit_labels,
    NEW.initial_value,
    GREATEST(NEW.initial_value, NEW.current_value),
    NEW.description,
    NEW.is_public AND NEW.status NOT IN ('sold','closed')
  )
  ON CONFLICT (catalogue_property_id) DO UPDATE SET
    property_name = EXCLUDED.property_name,
    location = EXCLUDED.location,
    plot_sizes = EXCLUDED.plot_sizes,
    price_range_min = EXCLUDED.price_range_min,
    price_range_max = EXCLUDED.price_range_max,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_shared_property_catalogue ON public.tokenized_properties;
CREATE TRIGGER trg_sync_shared_property_catalogue
AFTER INSERT OR UPDATE OR DELETE ON public.tokenized_properties
FOR EACH ROW EXECUTE FUNCTION public.sync_shared_property_catalogue();

-- Synchronise existing rows immediately.
UPDATE public.tokenized_properties
SET updated_at = updated_at;
