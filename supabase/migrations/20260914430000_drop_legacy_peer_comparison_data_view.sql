-- Drop legacy peer_comparison_data view that invents cost/success aggregates
-- outside the hardened get_peer_comparison RPC (farmer_count + recommendation bind).

REVOKE ALL ON TABLE public.peer_comparison_data FROM PUBLIC;
REVOKE ALL ON TABLE public.peer_comparison_data FROM anon;
REVOKE ALL ON TABLE public.peer_comparison_data FROM authenticated;

DROP VIEW IF EXISTS public.peer_comparison_data;
