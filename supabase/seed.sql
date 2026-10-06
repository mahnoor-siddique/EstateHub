-- EstateHub — demo seed data (Phase 6).
--
-- Generated from lib/data/demo.ts (the source of truth): 3 fictional agents, 6 fictional
-- properties and their 36 gallery photos. Not real people, businesses or listings.
--
-- Safe to re-run: every row has a fixed UUID and is upserted (insert ... on conflict (id) do
-- update), so running it again restores the seeded rows to these values without duplicating them.
-- Only rows with these ids are touched; any other data in the database is left alone.
--
-- Stable ids are UUIDv5 (namespace 6ba7b811-9dad-11d1-80b4-00c04fd430c8) of "estatehub:<kind>:<demo id>":
--   6ceb4716-6d87-591e-9ead-212a4e979b44  agent     demo-agent-sara
--   a95715d6-6aea-5d6c-a00e-d167473cf091  agent     demo-agent-hamza
--   08b56262-64ee-5f94-ad69-a602daed5be9  agent     demo-agent-ayesha
--   ba3d940c-b0d1-50dd-9fb1-44f62f2d2264  property  demo-dha-lahore-villa
--   bd780e98-1dd6-58fd-9ccd-845cc15c976f  property  demo-clifton-apartment
--   edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634  property  demo-bahria-rawalpindi-house
--   2b07e530-d88b-5502-bfcb-cb47ff0c92a1  property  demo-dha-islamabad-house
--   62d9706c-4aab-5f19-bbda-8645e9a41ae3  property  demo-gulberg-penthouse
--   58adfec8-d1f9-5d8f-8a21-6a24026f74d3  property  demo-citi-faisalabad-house
--
-- Photos live in the AWS S3 image bucket, not in Supabase: image_url holds each photo's full S3
-- URL (properties/<property id>/<name>.webp), which the app uses directly. storage_path is a
-- leftover column from the earlier Supabase Storage setup and is always null.
--
-- Agent portraits live in the same bucket under agents/<agent id>/<name>.webp, and profile_image
-- holds the portrait's full S3 URL.
--
-- How to run (needs a privileged role — the website's publishable key cannot write, by design):
--   * Supabase dashboard → SQL Editor: paste this file and run it, or
--   * Supabase CLI: `supabase db reset` runs it automatically against a local database.

begin;

-- Gallery positions are unique per property; defer that check so re-runs can reorder photos.
set constraints public.property_images_property_id_sort_order_key deferred;

insert into public.agents (id, full_name, title, bio, agency_name, profile_image, created_at)
values
  ('6ceb4716-6d87-591e-9ead-212a4e979b44', 'Sara Malik', 'Senior Property Consultant', 'Sara advises buyers and sellers on premium family homes and villas in DHA Lahore and DHA Islamabad, with a focus on realistic valuations and smooth, well-documented transfers.', 'Northgate Realty', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/agents/6ceb4716-6d87-591e-9ead-212a4e979b44/sara-malik.webp', '2026-08-01 00:00:00+00'),
  ('a95715d6-6aea-5d6c-a00e-d167473cf091', 'Hamza Qureshi', 'Residential Sales Advisor', 'Hamza specialises in apartments and penthouses, from sea-facing homes in Clifton to high-rise living in Gulberg, helping clients compare buildings, amenities and long-term value.', 'Harbourline Estates', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/agents/a95715d6-6aea-5d6c-a00e-d167473cf091/hamza-qureshi.webp', '2026-08-01 00:01:00+00'),
  ('08b56262-64ee-5f94-ad69-a602daed5be9', 'Ayesha Rehman', 'Lettings & Sales Specialist', 'Ayesha handles family homes for sale and rent in Rawalpindi and Faisalabad, guiding first-time buyers and tenants through viewings, paperwork and move-in day.', 'Greenfield Property Group', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/agents/08b56262-64ee-5f94-ad69-a602daed5be9/ayesha-rehman.webp', '2026-08-01 00:02:00+00')
on conflict (id) do update set
  full_name = excluded.full_name,
  title = excluded.title,
  bio = excluded.bio,
  agency_name = excluded.agency_name,
  profile_image = excluded.profile_image,
  created_at = excluded.created_at;

insert into public.properties (
  id, agent_id, title, description, property_type, listing_type, price, city, area_location, address,
  bedrooms, bathrooms, area, area_unit, year_built, parking_spaces, status,
  has_parking, has_garden, has_swimming_pool, has_security, has_gym, is_furnished, has_air_conditioning, has_backup_power,
  created_at
)
values
  ('ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', '6ceb4716-6d87-591e-9ead-212a4e979b44', 'Modern Villa with Landscaped Garden',
   'A contemporary one-kanal villa set behind a landscaped front garden in a quiet DHA Phase 6 street. Double-height living spaces open onto a private pool deck, the kitchen is fitted with stone counters and a separate prep area, and every bedroom has its own bathroom. Solar-backed power, a gated driveway and staff quarters complete a home designed for everyday comfort and easy entertaining.',
   'Villa', 'For Sale', 185000000, 'Lahore', 'DHA Phase 6', null,
   5, 6, 1, 'Kanal', 2021, 3, 'available',
   true, true, true, true, false, false, false, true,
   '2026-09-02 00:00:00+00'),
  ('bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'a95715d6-6aea-5d6c-a00e-d167473cf091', 'Sea-Facing Luxury Apartment',
   'A bright three-bedroom apartment on a high floor in Clifton Block 5, with wide windows framing the sea. The unit is fully furnished and air-conditioned, and residents share a gym, round-the-clock security and backup power. Two covered parking spaces and quick access to Clifton''s cafés and schools make it an easy long-term rental.',
   'Apartment', 'For Rent', 280000, 'Karachi', 'Clifton Block 5', null,
   3, 4, 2100, 'sq ft', 2019, 2, 'available',
   true, false, false, true, true, true, true, true,
   '2026-09-18 00:00:00+00'),
  ('edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', '08b56262-64ee-5f94-ad69-a602daed5be9', 'Contemporary Family Home',
   'A newly built ten-marla family home in Bahria Town Phase 8, finished in warm, neutral tones. The ground floor combines a drawing room, open-plan lounge and kitchen, with four bedrooms arranged across two floors. A small lawn, gated parking and the society''s security and amenities make it a practical, move-in-ready choice.',
   'House', 'For Sale', 95000000, 'Rawalpindi', 'Bahria Town Phase 8', null,
   4, 5, 10, 'Marla', 2022, 2, 'available',
   true, true, false, true, false, false, false, false,
   '2026-08-21 00:00:00+00'),
  ('2b07e530-d88b-5502-bfcb-cb47ff0c92a1', '6ceb4716-6d87-591e-9ead-212a4e979b44', 'Executive Residence near the Hills',
   'An executive six-bedroom residence in DHA Phase 2 with open views towards the Margalla foothills. Generous reception rooms, a home gym and a heated pool sit alongside a mature garden and a basement suited to a home office or media room. Built for large families who want space, privacy and quality finishes.',
   'House', 'For Sale', 210000000, 'Islamabad', 'DHA Phase 2', null,
   6, 7, 1, 'Kanal', 2020, 4, 'available',
   true, true, true, true, true, false, false, true,
   '2026-09-10 00:00:00+00'),
  ('62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'a95715d6-6aea-5d6c-a00e-d167473cf091', 'Skyline Penthouse with Terrace',
   'A three-bedroom penthouse in the heart of Gulberg III, topped by a private terrace with skyline views. Floor-to-ceiling glazing fills the living areas with light, and the building provides a gym, secure parking and backup power. Ideal for buyers who want city-centre convenience without giving up outdoor space.',
   'Apartment', 'For Sale', 68000000, 'Lahore', 'Gulberg III', null,
   3, 4, 2800, 'sq ft', 2018, 2, 'available',
   true, false, false, true, true, false, true, true,
   '2026-09-14 00:00:00+00'),
  ('58adfec8-d1f9-5d8f-8a21-6a24026f74d3', '08b56262-64ee-5f94-ad69-a602daed5be9', 'Bright Corner House, Ready to Move',
   'A well-kept corner house off Canal Road with extra light and ventilation from two open sides. Four bedrooms, a family lounge, a fitted kitchen and a small garden are ready for a family to move straight in. Air conditioning is installed in the main rooms, and there is secure parking for two cars.',
   'House', 'For Rent', 150000, 'Faisalabad', 'Canal Road', null,
   4, 4, 10, 'Marla', 2017, 2, 'available',
   true, true, false, false, false, false, true, false,
   '2026-08-30 00:00:00+00')
on conflict (id) do update set
  agent_id = excluded.agent_id,
  title = excluded.title,
  description = excluded.description,
  property_type = excluded.property_type,
  listing_type = excluded.listing_type,
  price = excluded.price,
  city = excluded.city,
  area_location = excluded.area_location,
  address = excluded.address,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  area = excluded.area,
  area_unit = excluded.area_unit,
  year_built = excluded.year_built,
  parking_spaces = excluded.parking_spaces,
  status = excluded.status,
  has_parking = excluded.has_parking,
  has_garden = excluded.has_garden,
  has_swimming_pool = excluded.has_swimming_pool,
  has_security = excluded.has_security,
  has_gym = excluded.has_gym,
  is_furnished = excluded.is_furnished,
  has_air_conditioning = excluded.has_air_conditioning,
  has_backup_power = excluded.has_backup_power,
  created_at = excluded.created_at;

-- Drop photos on the seeded properties that are no longer in the seed, so a re-run mirrors it.
delete from public.property_images
where property_id in ('ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3')
  and id not in (
    'd849e223-cf59-5453-bc1d-8efc38b32ade',
    'a65cd623-58f1-5165-ac3c-33095318820e',
    '7d9a7a8f-6205-58ea-9fbc-0cebcbab615a',
    '52f8a8b9-8e8b-5cbe-b77d-e0906392c693',
    'c52ab4b1-1c50-5012-9828-67f42f162c02',
    'c093cbca-b4f1-59eb-b5e5-1d5b6979483d',
    'fab5eff5-fc16-5dc4-bb1d-7319f782e19e',
    '660028b2-c528-5749-a5fa-de67c32fa1b1',
    '13c9a6cc-3f0b-5b8b-9c55-a2ffc58d478f',
    '9177ec18-6d0b-58ca-bbf8-72d6d7bd5086',
    '6d15b8ea-1fce-5001-beca-7f4b50da43fd',
    '0bcdd98d-20cf-5649-80c9-624bdf3fc2d8',
    '9088786e-445c-55c6-a85a-8ed5e9c45ee3',
    'b98dcf03-066c-5d7b-9ab6-87b180d68893',
    '16759e4f-4ec3-57ea-acf6-ced78c64caf1',
    'f1ae2254-d242-58a2-8765-c87babd8934b',
    '1259aa37-e02f-506f-8495-d008013fd6de',
    '03ce1495-4cdb-50df-9244-3fb7f40fd600',
    'fe71cfd1-9e24-5128-85fe-96e1b2a1d2e9',
    '5ba558c3-11d4-594f-912c-edf86c45f21a',
    'bad9e4be-df9f-591d-ba07-758ba0d71df5',
    'e735f18d-bf15-5ae6-b32e-92740155e0a8',
    '7cfbd9ca-ba32-5f96-a978-ceb1057fe29d',
    '1062e5f8-d24c-5d10-91d5-1377097498d9',
    '0aa87ead-ef5f-5874-849b-1e7795379f7f',
    'c9b3c0dc-90a5-507f-95e9-c5f3c1d5fc22',
    '0cd97e16-88ab-59da-874e-b4f2f971f61d',
    '55eacbd3-6e33-5a95-9a4a-7813d5c55430',
    '75c8eef7-ea27-590e-abb4-a8acec4ad252',
    'da75634f-4382-5b41-9f79-f07179bebdb9',
    '2e7971b4-72e9-51d8-9120-d95fe7c9e7ce',
    '16ecaef4-6f78-51d5-9719-830b916ecf8b',
    '49304341-d688-5822-9c6b-7d6f0d88b866',
    '175d5270-1553-53fa-8142-e41b1386f733',
    '34777a5c-8863-5e02-a9fb-21ea548f3797',
    'db0e7c63-785b-5197-9945-76864f44789d'
  );

insert into public.property_images (id, property_id, image_url, storage_path, alt_text, label, sort_order)
values
  ('d849e223-cf59-5453-bc1d-8efc38b32ade', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/main.webp', null, 'Front of the modern villa at dusk, with a landscaped lawn, lit entrance and gated driveway', 'Exterior', 0),
  ('a65cd623-58f1-5165-ac3c-33095318820e', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/living-room.webp', null, 'Living room with a large sectional sofa, marble feature wall and glass doors to the garden', 'Living room', 1),
  ('7d9a7a8f-6205-58ea-9fbc-0cebcbab615a', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/master-bedroom.webp', null, 'Master bedroom with an upholstered bed and sliding doors opening onto the pool garden', 'Master bedroom', 2),
  ('52f8a8b9-8e8b-5cbe-b77d-e0906392c693', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/kitchen.webp', null, 'Kitchen with a marble waterfall island, bar stools and glass pendant lights', 'Kitchen', 3),
  ('c52ab4b1-1c50-5012-9828-67f42f162c02', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/bathroom.webp', null, 'Master bathroom with a freestanding tub, glass walk-in shower and marble double vanity', 'Luxury master bathroom', 4),
  ('c093cbca-b4f1-59eb-b5e5-1d5b6979483d', 'ba3d940c-b0d1-50dd-9fb1-44f62f2d2264', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/ba3d940c-b0d1-50dd-9fb1-44f62f2d2264/garden-pool.webp', null, 'Back garden with a swimming pool, water feature and outdoor lounge seating', 'Garden & pool', 5),
  ('fab5eff5-fc16-5dc4-bb1d-7319f782e19e', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/main.webp', null, 'Seafront apartment tower with glass balconies, a gated landscaped entrance and the beach alongside', 'Sea-facing apartment exterior', 0),
  ('660028b2-c528-5749-a5fa-de67c32fa1b1', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/living-room.webp', null, 'Living room with a cream sectional sofa, marble coffee table and floor-to-ceiling windows facing the sea', 'Sea-view living room', 1),
  ('13c9a6cc-3f0b-5b8b-9c55-a2ffc58d478f', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/master-bedroom.webp', null, 'Master bedroom with an upholstered bed and sliding glass doors opening onto a sea-facing balcony', 'Master bedroom', 2),
  ('9177ec18-6d0b-58ca-bbf8-72d6d7bd5086', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/kitchen.webp', null, 'Kitchen with a marble waterfall island, three bar stools, glass pendant lights and a view of the sea', 'Modern luxury kitchen', 3),
  ('6d15b8ea-1fce-5001-beca-7f4b50da43fd', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/bathroom.webp', null, 'Master bathroom with a freestanding tub by a full-height window, glass shower and marble double vanity', 'Luxury master bathroom', 4),
  ('0bcdd98d-20cf-5649-80c9-624bdf3fc2d8', 'bd780e98-1dd6-58fd-9ccd-845cc15c976f', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/bd780e98-1dd6-58fd-9ccd-845cc15c976f/balcony-sea-view.webp', null, 'Balcony with outdoor lounge seating and a glass railing overlooking the beach and coastline', 'Balcony & sea view', 5),
  ('9088786e-445c-55c6-a85a-8ed5e9c45ee3', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/main.webp', null, 'Contemporary two-storey white house with a wood-panelled entrance, glass-railed balcony, covered carport and landscaped front lawn at dusk', 'Contemporary exterior', 0),
  ('b98dcf03-066c-5d7b-9ab6-87b180d68893', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/living-room.webp', null, 'Open-plan lounge with a grey sectional sofa, herringbone wood floor and track lighting, beside a white gloss kitchen', 'Open-plan lounge', 1),
  ('16759e4f-4ec3-57ea-acf6-ced78c64caf1', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/master-bedroom.webp', null, 'Sunlit master bedroom with an upholstered headboard, wall-mounted TV and floor-to-ceiling white wardrobes', 'Master bedroom', 2),
  ('f1ae2254-d242-58a2-8765-c87babd8934b', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/kitchen.webp', null, 'Kitchen with a stone island and induction hob, wood-panelled backsplash and glass pendant lights, opening onto the lounge', 'Kitchen & island', 3),
  ('1259aa37-e02f-506f-8495-d008013fd6de', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/bathroom.webp', null, 'Master bathroom with a freestanding tub, double vessel basins on a floating vanity, textured stone walls and a glass shower', 'Master bathroom', 4),
  ('03ce1495-4cdb-50df-9244-3fb7f40fd600', 'edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/edc9a0a4-16ae-529f-b6c5-b1ad4b0b0634/terrace.webp', null, 'White arched veranda with an outdoor wooden table and potted plants, looking out over the garden lawn', 'Garden & veranda', 5),
  ('fe71cfd1-9e24-5128-85fe-96e1b2a1d2e9', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/main.webp', null, 'Front of the executive residence at sunset, with a lit entrance, gated driveway and hills behind', 'Executive Residence exterior', 0),
  ('5ba558c3-11d4-594f-912c-edf86c45f21a', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/living-room.webp', null, 'Open-plan living room with a sectional sofa, ring chandelier and glass doors to the pool and hills', 'Luxury living room', 1),
  ('bad9e4be-df9f-591d-ba07-758ba0d71df5', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/master-bedroom.webp', null, 'Master bedroom with an upholstered bed and a private balcony overlooking the hills', 'Master bedroom', 2),
  ('e735f18d-bf15-5ae6-b32e-92740155e0a8', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/kitchen.webp', null, 'Kitchen with a marble waterfall island, four bar stools and glass pendant lights', 'Modern luxury kitchen', 3),
  ('7cfbd9ca-ba32-5f96-a978-ceb1057fe29d', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/bathroom.webp', null, 'Master bathroom with a freestanding tub beneath a large window, glass shower and double vanity', 'Luxury master bathroom', 4),
  ('1062e5f8-d24c-5d10-91d5-1377097498d9', '2b07e530-d88b-5502-bfcb-cb47ff0c92a1', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/2b07e530-d88b-5502-bfcb-cb47ff0c92a1/garden-pool.webp', null, 'Back garden with a swimming pool, waterfall feature, outdoor lounge and a view of the hills at sunset', 'Garden & swimming pool', 5),
  ('0aa87ead-ef5f-5874-849b-1e7795379f7f', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/main.webp', null, 'Penthouse building at night with warm lighting, glass-railed upper terraces and the city skyline in the distance', 'Skyline Penthouse exterior', 0),
  ('c9b3c0dc-90a5-507f-95e9-c5f3c1d5fc22', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/living-room.webp', null, 'Living room with a cream sectional sofa, ring chandelier, marble fireplace wall and glass doors to a city-view terrace', 'Luxury living room', 1),
  ('0cd97e16-88ab-59da-874e-b4f2f971f61d', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/master-bedroom.webp', null, 'Master bedroom with an upholstered bed and sliding glass doors opening onto a terrace overlooking the city at night', 'Master bedroom', 2),
  ('55eacbd3-6e33-5a95-9a4a-7813d5c55430', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/kitchen.webp', null, 'Kitchen with a marble waterfall island, four bar stools, glass pendant lights and a dining area facing the skyline', 'Modern luxury kitchen', 3),
  ('75c8eef7-ea27-590e-abb4-a8acec4ad252', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/bathroom.webp', null, 'Master bathroom with a freestanding tub by a city-view window, glass shower and marble vanity', 'Luxury master bathroom', 4),
  ('da75634f-4382-5b41-9f79-f07179bebdb9', '62d9706c-4aab-5f19-bbda-8645e9a41ae3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/62d9706c-4aab-5f19-bbda-8645e9a41ae3/terrace.webp', null, 'Private terrace with lounge seating, an outdoor dining table and barbecue counter overlooking the city skyline at night', 'Private terrace', 5),
  ('2e7971b4-72e9-51d8-9120-d95fe7c9e7ce', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/main.webp', null, 'Modern two-storey house with a glass-railed balcony, seen through open gates across a paved driveway and lawn', 'Corner house exterior', 0),
  ('16ecaef4-6f78-51d5-9719-830b916ecf8b', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/living-room.webp', null, 'Living room with a grey sectional sofa, layered wooden coffee tables, pendant lights and a wood-slat feature wall', 'Family living room', 1),
  ('49304341-d688-5822-9c6b-7d6f0d88b866', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/bedroom.webp', null, 'Master bedroom with a white-covered bed, bedside lamps, a ceiling fan and two large windows', 'Master bedroom', 2),
  ('175d5270-1553-53fa-8142-e41b1386f733', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/kitchen.webp', null, 'Fitted kitchen with built-in oven and microwave, a steel fridge and a four-seat dining table', 'Fitted kitchen', 3),
  ('34777a5c-8863-5e02-a9fb-21ea548f3797', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/bathroom.webp', null, 'Master bathroom with a marble-tiled glass shower, freestanding tub and wooden vanity', 'Master bathroom', 4),
  ('db0e7c63-785b-5197-9945-76864f44789d', '58adfec8-d1f9-5d8f-8a21-6a24026f74d3', 'https://estatehub-property-images-933270760885.s3.eu-north-1.amazonaws.com/properties/58adfec8-d1f9-5d8f-8a21-6a24026f74d3/terrace.webp', null, 'Timber deck terrace with an outdoor dining table under a pergola, beside the lawn', 'Garden & terrace', 5)
on conflict (id) do update set
  property_id = excluded.property_id,
  image_url = excluded.image_url,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  label = excluded.label,
  sort_order = excluded.sort_order;

commit;
