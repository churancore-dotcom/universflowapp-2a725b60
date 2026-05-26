
ALTER TABLE public.user_subscriptions DISABLE TRIGGER USER;

UPDATE public.user_subscriptions us
SET subscription_type = 'premium_yearly',
    status = 'active',
    expires_at = '2099-12-31 23:59:59+00'::timestamptz,
    platform = 'web',
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.payment_requests pr
  WHERE pr.user_id = us.user_id
    AND pr.status IN ('approved','auto_approved')
    AND pr.plan = 'lifetime'
);

ALTER TABLE public.user_subscriptions ENABLE TRIGGER USER;
