
-- Security definer function to safely check session membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_session_member(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listening_session_members
    WHERE session_id = _session_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_session_host(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listening_sessions
    WHERE id = _session_id AND host_user_id = _user_id
  );
$$;

-- Replace recursive SELECT policy on listening_session_members
DROP POLICY IF EXISTS "Members can view session members" ON public.listening_session_members;
CREATE POLICY "Members can view session members"
ON public.listening_session_members
FOR SELECT
TO authenticated
USING (
  public.is_session_member(session_id, auth.uid())
  OR public.is_session_host(session_id, auth.uid())
);

-- Replace SELECT policy on listening_sessions to also use safe function
DROP POLICY IF EXISTS "Members and host can view session" ON public.listening_sessions;
CREATE POLICY "Members and host can view session"
ON public.listening_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_user_id
  OR public.is_session_member(id, auth.uid())
);
