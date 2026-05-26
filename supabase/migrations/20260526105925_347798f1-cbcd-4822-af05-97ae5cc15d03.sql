CREATE OR REPLACE FUNCTION public.on_premium_activated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_was_premium boolean := false;
  v_is_premium  boolean;
  v_should_mark boolean := false;
BEGIN
  v_is_premium := NEW.status = 'active'
    AND NEW.subscription_type IN ('premium_monthly','premium_yearly')
    AND (NEW.expires_at IS NULL OR NEW.expires_at > now());

  IF TG_OP = 'UPDATE' THEN
    v_was_premium := OLD.status = 'active'
      AND OLD.subscription_type IN ('premium_monthly','premium_yearly')
      AND (OLD.expires_at IS NULL OR OLD.expires_at > now());
    v_should_mark := v_is_premium
      AND (NOT v_was_premium OR NEW.expires_at IS DISTINCT FROM OLD.expires_at);
  ELSE
    v_should_mark := v_is_premium;
  END IF;

  IF v_should_mark THEN
    NEW.notif_activated_at := COALESCE(NEW.notif_activated_at, now());
    NEW.notif_warn_3d_at := NULL;
    NEW.notif_warn_1d_at := NULL;
    NEW.notif_expired_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;