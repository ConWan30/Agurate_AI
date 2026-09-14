-- Durable public (IP) rate-limit events for unauthenticated edges (e.g. beta-signup).
-- Plus idempotent demo field upserts via UNIQUE(user_id, name).

CREATE TABLE IF NOT EXISTS public.edge_ip_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  bucket TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_ip_rate_limits_bucket_ip_time
  ON public.edge_ip_rate_limits (bucket, ip_hash, created_at DESC);

ALTER TABLE public.edge_ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies — service role only (edge functions).
REVOKE ALL ON public.edge_ip_rate_limits FROM PUBLIC;
REVOKE ALL ON public.edge_ip_rate_limits FROM anon;
REVOKE ALL ON public.edge_ip_rate_limits FROM authenticated;
GRANT ALL ON public.edge_ip_rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.edge_ip_rate_limits_id_seq TO service_role;

-- Demo setup uses onConflict: 'user_id,name'
CREATE UNIQUE INDEX IF NOT EXISTS fields_user_id_name_unique
  ON public.fields (user_id, name);
