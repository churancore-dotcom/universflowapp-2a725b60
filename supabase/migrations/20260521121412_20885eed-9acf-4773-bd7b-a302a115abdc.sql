
-- 1. Reaffirm column-level revoke on app_reviews.user_id for anon/public
REVOKE SELECT (user_id) ON public.app_reviews FROM anon;
REVOKE SELECT (user_id) ON public.app_reviews FROM public;

-- 2. promo_codes: add explicit restrictive deny for anon
DROP POLICY IF EXISTS "Anon cannot read promo codes" ON public.promo_codes;
CREATE POLICY "Anon cannot read promo codes"
ON public.promo_codes
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- 3. push_history: add restrictive admin-only policy covering all roles
DROP POLICY IF EXISTS "Only admins can access push history" ON public.push_history;
CREATE POLICY "Only admins can access push history"
ON public.push_history
AS RESTRICTIVE
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
