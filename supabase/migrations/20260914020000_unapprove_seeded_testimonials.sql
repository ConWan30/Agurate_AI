-- Unapprove seeded fabricated testimonials for closed-beta honesty.
-- Idempotent: only flips known seed rows.

UPDATE public.farmer_testimonials
SET approved = false
WHERE farmer_name IN ('James Collins', 'Maria Thompson', 'Robert Davis')
  AND approved = true;
