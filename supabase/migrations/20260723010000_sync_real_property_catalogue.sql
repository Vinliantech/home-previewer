-- Replace the original placeholder property catalogue with the six current
-- Kay-Steph projects used by the public website, admin, client and affiliate
-- experiences. Exact-name deletes keep the cleanup scoped to the old seed.

DELETE FROM public.tokenized_properties
WHERE name IN (
  'The Grove Residence, Lekki',
  'Cedar Court Apartments, Ikoyi',
  'Palm Ridge Estate Plot, Abuja'
);

DELETE FROM public.estates
WHERE name IN ('Guzape Heights Estate', 'Karsana Green Estate', 'Abacha Barracks Phase II');

DELETE FROM public.available_properties
WHERE property_name IN (
  'The Grove Residence, Lekki',
  'Cedar Court Apartments, Ikoyi',
  'Palm Ridge Estate Plot, Abuja',
  'Guzape Heights Estate',
  'Karsana Green Estate'
);

INSERT INTO public.available_properties (
  id, property_name, location, plot_sizes, price_range_min, price_range_max,
  description, is_active
) VALUES
  ('40000000-0000-4000-8000-000000000001', 'Dream House in Guzape', 'Guzape, Abuja', ARRAY['5-bedroom luxury terrace'], 500000000, 500000000, 'Five completed luxury terraces on Kenneth Minimah Crescent, Guzape.', true),
  ('40000000-0000-4000-8000-000000000002', 'Ruby''s Apartment', 'Jahi, Abuja', ARRAY['2-bedroom apartment','3-bedroom apartment'], 140000000, 160000000, 'Modern two- and three-bedroom serviced apartments in Jahi.', true),
  ('40000000-0000-4000-8000-000000000003', 'Lillycrest Luxury Terrace', 'Life Camp, Abuja', ARRAY['4-bedroom terrace + BQ'], 250000000, 250000000, 'Four-bedroom luxury terraces with boys'' quarters in Life Camp.', true),
  ('40000000-0000-4000-8000-000000000004', 'Lillycrest Residence', 'Karsana, Abuja', ARRAY['3-bedroom apartment','4-bedroom terrace + BQ','4-bedroom semi-detached + BQ','4-bedroom detached + BQ'], 90000000, 210000000, 'Detached, semi-detached, terrace and apartment homes in Karsana.', true),
  ('40000000-0000-4000-8000-000000000005', 'Estate Plots — Phase II', 'Behind Abacha Barracks, Abuja', ARRAY['350 sqm','500 sqm','600 sqm','1,000 sqm'], 22750000, 65000000, 'Surveyed estate plots available in four sizes.', true),
  ('40000000-0000-4000-8000-000000000006', 'Daverek Luxury Apartments', 'Katampe, Abuja', ARRAY['3-bedroom luxury apartment'], 130000000, 130000000, 'Three-bedroom luxury apartments in Katampe.', true)
ON CONFLICT (id) DO UPDATE SET
  property_name = EXCLUDED.property_name,
  location = EXCLUDED.location,
  plot_sizes = EXCLUDED.plot_sizes,
  price_range_min = EXCLUDED.price_range_min,
  price_range_max = EXCLUDED.price_range_max,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.estates (id, name, location, total_land_size, description) VALUES
  ('30000000-0000-4000-8000-000000000001', 'Dream House in Guzape', 'Guzape, Abuja', '5 luxury terraces', 'Completed luxury terraces on Kenneth Minimah Crescent.'),
  ('30000000-0000-4000-8000-000000000002', 'Ruby''s Apartment', 'Jahi, Abuja', '2 & 3 bedroom apartments', 'Modern serviced city apartments in Jahi.'),
  ('30000000-0000-4000-8000-000000000003', 'Lillycrest Luxury Terrace', 'Life Camp, Abuja', '4 bedrooms + BQ', 'Contemporary luxury terraces in Life Camp.'),
  ('30000000-0000-4000-8000-000000000004', 'Lillycrest Residence', 'Karsana, Abuja', '4 residential unit types', 'Detached, semi-detached, terrace and apartment homes.'),
  ('30000000-0000-4000-8000-000000000005', 'Estate Plots — Phase II', 'Behind Abacha Barracks, Abuja', '350–1,000 sqm plots', 'Surveyed estate land available in four plot sizes.'),
  ('30000000-0000-4000-8000-000000000006', 'Daverek Luxury Apartments', 'Katampe, Abuja', '3 bedroom apartments', 'Three-bedroom luxury apartments in Katampe.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  total_land_size = EXCLUDED.total_land_size,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO public.tokenized_properties (
  id, name, location, description, property_type, images, initial_value,
  current_value, min_investors, max_investors, min_investment, token_value,
  funding_deadline, expected_rental_yield, expected_appreciation, status,
  legal_title, management_fee_pct, exit_terms, risk_disclosure, spv_id
) VALUES
  ('20000000-0000-4000-8000-000000000001', 'Dream House in Guzape', 'Guzape, Abuja', 'Five completed luxury terraces on Kenneth Minimah Crescent, Guzape.', 'Luxury Terrace', ARRAY['/properties/dream-house-guzape.jpg'], 500000000, 500000000, 1, 50, 10000000, 1000000, (now() + interval '180 days')::date, 0, 18, 'open', 'Verified title pack available from Kay-Steph', 0, 'Terms are supplied for the selected ownership route before commitment.', 'Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.', NULL),
  ('20000000-0000-4000-8000-000000000002', 'Ruby''s Apartment', 'Jahi, Abuja', 'Modern two- and three-bedroom serviced apartments in Jahi.', 'Serviced Apartment', ARRAY['/properties/rubys-apartment-jahi.jpg'], 140000000, 140000000, 4, 140, 1000000, 1000000, (now() + interval '180 days')::date, 0, 15, 'open', 'Verified title pack available from Kay-Steph', 0, 'Terms are supplied for the selected ownership route before commitment.', 'Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.', NULL),
  ('20000000-0000-4000-8000-000000000003', 'Lillycrest Luxury Terrace', 'Life Camp, Abuja', 'Four-bedroom luxury terraces with boys'' quarters in Life Camp.', 'Luxury Terrace', ARRAY['/properties/lillycrest-terrace-lifecamp.jpg'], 250000000, 250000000, 4, 50, 5000000, 1000000, (now() + interval '180 days')::date, 0, 16, 'open', 'Verified title pack available from Kay-Steph', 0, 'Terms are supplied for the selected ownership route before commitment.', 'Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.', NULL),
  ('20000000-0000-4000-8000-000000000004', 'Lillycrest Residence', 'Karsana, Abuja', 'Detached, semi-detached, terrace and apartment homes in Karsana.', 'Mixed Residential Development', ARRAY['/properties/lillycrest-residence-karsana.jpg'], 90000000, 90000000, 4, 90, 5000000, 1000000, (now() + interval '180 days')::date, 0, 17, 'open', 'Verified title pack available from Kay-Steph', 0, 'Terms are supplied for the selected ownership route before commitment.', 'Property investment carries market, construction and liquidity risks. Review the project disclosure before committing.', NULL),
  ('20000000-0000-4000-8000-000000000005', 'Estate Plots — Phase II', 'Behind Abacha Barracks, Abuja', 'Surveyed estate plots from 350 to 1,000 square metres.', 'Estate Land', ARRAY['/properties/estate-plots-phase-ii.jpg'], 22750000, 22750000, 2, 65, 1000000, 1000000, (now() + interval '180 days')::date, 0, 22, 'open', 'Verified title pack available from Kay-Steph', 0, 'Terms are supplied for the selected ownership route before commitment.', 'Land investment has no rental yield and returns depend on appreciation. Review the project disclosure before committing.', NULL),
  ('20000000-0000-4000-8000-000000000006', 'Daverek Luxury Apartments', 'Katampe, Abuja', 'Three-bedroom luxury apartments in Katampe.', 'Luxury Apartment', ARRAY['/properties/daverek-luxury-apartments-katampe.jpg'], 130000000, 130000000, 1, 1, 130000000, 1000000, (now() + interval '180 days')::date, 0, 15, 'under_review', 'Verified title pack available from Kay-Steph', 0, 'Full-purchase terms are supplied before commitment.', 'Property purchase carries market and construction risks. Review the project disclosure before committing.', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  property_type = EXCLUDED.property_type,
  images = EXCLUDED.images,
  initial_value = EXCLUDED.initial_value,
  min_investors = EXCLUDED.min_investors,
  max_investors = EXCLUDED.max_investors,
  min_investment = EXCLUDED.min_investment,
  token_value = EXCLUDED.token_value,
  funding_deadline = EXCLUDED.funding_deadline,
  expected_rental_yield = EXCLUDED.expected_rental_yield,
  expected_appreciation = EXCLUDED.expected_appreciation,
  status = EXCLUDED.status,
  legal_title = EXCLUDED.legal_title,
  management_fee_pct = EXCLUDED.management_fee_pct,
  exit_terms = EXCLUDED.exit_terms,
  risk_disclosure = EXCLUDED.risk_disclosure,
  updated_at = now();
