CREATE OR REPLACE FUNCTION public.consume_free_skip()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_max_per_hour int := 6;
  v_count int;
  v_window_start timestamptz;
BEGIN
  IF v_user IS NULL THEN
    -- Logged-out listeners aren't capped (they don't have a queue UX anyway)
    RETURN jsonb_build_object('allowed', true, 'remaining', null, 'premium', false);
  END IF;

  -- Premium = unlimited
  IF public.is_premium_user(v_user) THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', null, 'premium', true);
  END IF;

  -- Atomic upsert keyed on (user_id, endpoint)
  INSERT INTO public.api_rate_limits(user_id, endpoint, window_start, request_count)
  VALUES (v_user, 'free_skip', now(), 1)
  ON CONFLICT (user_id, endpoint) DO UPDATE
    SET request_count = CASE
          WHEN public.api_rate_limits.window_start < now() - interval '1 hour' THEN 1
          ELSE public.api_rate_limits.request_count + 1
        END,
        window_start = CASE
          WHEN public.api_rate_limits.window_start < now() - interval '1 hour' THEN now()
          ELSE public.api_rate_limits.window_start
        END
  RETURNING request_count, window_start INTO v_count, v_window_start;

  IF v_count > v_max_per_hour THEN
    -- Roll back the over-count so the row stays accurate
    UPDATE public.api_rate_limits
       SET request_count = v_max_per_hour
     WHERE user_id = v_user AND endpoint = 'free_skip';
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'premium', false);
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_max_per_hour - v_count,
    'premium', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_free_skip() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_free_skip() TO authenticated;