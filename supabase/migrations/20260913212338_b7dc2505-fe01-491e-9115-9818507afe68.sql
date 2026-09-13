CREATE OR REPLACE FUNCTION public.get_beta_farmer_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.profiles WHERE beta_farmer = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_beta_farmer_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_beta_farmer_count() TO authenticated;