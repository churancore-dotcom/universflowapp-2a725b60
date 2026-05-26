
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
  IF NEW.status IN ('approved','auto_approved')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN

    SELECT GREATEST(now(), COALESCE(expires_at, now()))
      INTO v_base
      FROM public.user_subscriptions
      WHERE user_id = NEW.user_id;
    v_base := COALESCE(v_base, now());

    IF NEW.plan = 'lifetime' THEN
      v_expires := '2099-12-31 23:59:59+00'::timestamptz;
      v_type := 'premium_yearly';
    ELSIF NEW.plan = 'quarterly' THEN
      v_expires := v_base + interval '90 days';
      v_type := 'premium_yearly';
    ELSE
      v_expires := v_base + interval '30 days';
      v_type := 'premium_monthly';
    END IF;

    INSERT INTO public.user_subscriptions (user_id, subscription_type, status, expires_at, platform)
    VALUES (NEW.user_id, v_type, 'active', v_expires, 'web')
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_type = EXCLUDED.subscription_type,
      status = 'active',
      expires_at = EXCLUDED.expires_at,
      platform = 'web',
      updated_at = now();

    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$function$;

-- Bypass the notification trigger for the bulk backfill so it doesn't try to
-- flood net.http_request_queue with welcome pushes for old approvals.
ALTER TABLE public.user_subscriptions DISABLE TRIGGER USER;

WITH latest_approved AS (
  SELECT DISTINCT ON (pr.user_id)
    pr.user_id, pr.plan, COALESCE(pr.reviewed_at, pr.created_at) AS base_ts
  FROM public.payment_requests pr
  WHERE pr.status IN ('approved','auto_approved')
  ORDER BY pr.user_id, COALESCE(pr.reviewed_at, pr.created_at) DESC
),
needs_grant AS (
  SELECT la.user_id, la.plan,
    CASE
      WHEN la.plan = 'lifetime'  THEN '2099-12-31 23:59:59+00'::timestamptz
      WHEN la.plan = 'quarterly' THEN GREATEST(now(), la.base_ts) + interval '90 days'
      ELSE GREATEST(now(), la.base_ts) + interval '30 days'
    END AS expires_at,
    CASE
      WHEN la.plan IN ('quarterly','lifetime') THEN 'premium_yearly'::subscription_type
      ELSE 'premium_monthly'::subscription_type
    END AS sub_type
  FROM latest_approved la
  LEFT JOIN public.user_subscriptions us ON us.user_id = la.user_id
  WHERE us.user_id IS NULL
     OR us.status <> 'active'
     OR us.subscription_type = 'free'
     OR (us.expires_at IS NOT NULL AND us.expires_at < now())
)
INSERT INTO public.user_subscriptions (user_id, subscription_type, status, expires_at, platform)
SELECT user_id, sub_type, 'active', expires_at, 'web'
FROM needs_grant
ON CONFLICT (user_id) DO UPDATE SET
  subscription_type = EXCLUDED.subscription_type,
  status = 'active',
  expires_at = EXCLUDED.expires_at,
  platform = 'web',
  updated_at = now();

ALTER TABLE public.user_subscriptions ENABLE TRIGGER USER;
