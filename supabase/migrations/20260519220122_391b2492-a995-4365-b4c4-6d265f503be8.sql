
-- Safe admin check (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  );
$$;

-- profiles: drop recursive admin policies and recreate using helper
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;

CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- access_requests: replace recursive admin policy
DROP POLICY IF EXISTS "Admin manages all requests" ON public.access_requests;
CREATE POLICY "Admin manages all requests"
ON public.access_requests
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- subscriptions: replace recursive admin policy
DROP POLICY IF EXISTS "Admin manages all subscriptions" ON public.subscriptions;
CREATE POLICY "Admin manages all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
