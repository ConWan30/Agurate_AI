-- Lovable cutover created a temporary privileged helper to apply migrations
-- from a sandbox role. It must not remain in production.
-- Safe no-op if the function was never created.

DROP FUNCTION IF EXISTS public.__tmp_apply_migration(text);
