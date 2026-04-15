
-- 1. Fix redeem_promo_code: use auth.uid() instead of p_user_id
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_promo_id UUID;
  v_existing_sub UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Single atomic operation with row-level locking
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND current_uses < max_uses
    AND NOT EXISTS (
      SELECT 1 FROM code_redemptions
      WHERE user_id = v_user_id AND promo_code_id = promo_codes.id
    )
  RETURNING id INTO v_promo_id;
  
  IF v_promo_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid, expired, or already redeemed code');
  END IF;
  
  -- Insert redemption record
  INSERT INTO code_redemptions (user_id, promo_code_id)
  VALUES (v_user_id, v_promo_id);
  
  -- Check for existing subscription
  SELECT id INTO v_existing_sub FROM user_subscriptions WHERE user_id = v_user_id LIMIT 1;
  
  -- Grant premium (upsert)
  IF v_existing_sub IS NOT NULL THEN
    UPDATE user_subscriptions
    SET subscription_type = 'premium_yearly',
        status = 'active',
        expires_at = '2099-12-31T23:59:59Z',
        platform = 'web',
        updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSE
    INSERT INTO user_subscriptions (user_id, subscription_type, status, expires_at, platform)
    VALUES (v_user_id, 'premium_yearly', 'active', '2099-12-31T23:59:59Z', 'web');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 2. Fix profiles: remove overly broad "Anyone can count profiles" policy
DROP POLICY IF EXISTS "Anyone can count profiles" ON public.profiles;

-- Create a safe user count function instead
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*) FROM public.profiles;
$$;

-- 3. Fix profiles: prevent is_admin self-escalation by replacing the user update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 4. Fix donations: restrict non-anonymous donations to authenticated users only
DROP POLICY IF EXISTS "Anyone can view non-anonymous donations" ON public.donations;

CREATE POLICY "Authenticated users can view non-anonymous donations"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (is_anonymous = false);
