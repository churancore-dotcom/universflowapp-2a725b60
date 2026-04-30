CREATE OR REPLACE FUNCTION public.grant_premium_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_expires timestamptz;
  v_type subscription_type;
  v_base timestamptz;
BEGIN
  IF NEW.status IN ('approved','auto_approved') AND OLD.status NOT IN ('approved','auto_approved') THEN
    SELECT GREATEST(now(), COALESCE(expires_at, now()))
      INTO v_base
      FROM user_subscriptions
      WHERE user_id = NEW.user_id;
    v_base := COALESCE(v_base, now());

    IF NEW.plan = 'quarterly' THEN
      v_expires := v_base + interval '90 days';
      v_type := 'premium_yearly';
    ELSE
      v_expires := v_base + interval '30 days';
      v_type := 'premium_monthly';
    END IF;

    INSERT INTO public.user_subscriptions (user_id, subscription_type, status, expires_at, platform)
    VALUES (NEW.user_id, v_type, 'active', v_expires, 'web')
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_type = v_type,
      status = 'active',
      expires_at = v_expires,
      platform = 'web',
      updated_at = now();
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_grant_premium_on_approval ON public.payment_requests;
CREATE TRIGGER trg_grant_premium_on_approval
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION public.grant_premium_on_approval();

INSERT INTO public.app_settings (key, value, description)
VALUES
  ('premium_price_monthly_inr', '49'::jsonb, 'Monthly premium price in INR'),
  ('premium_price_quarterly_inr', '120'::jsonb, '3-month premium price in INR')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;