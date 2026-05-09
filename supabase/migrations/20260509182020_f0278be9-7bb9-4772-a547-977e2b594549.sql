-- Revoke EXECUTE on sensitive SECURITY DEFINER functions from anon
-- These should only be callable by authenticated users (and the system).
-- Public clients should never be able to redeem codes, join sessions,
-- send pushes, or write audit log entries while signed-out.

REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_listening_session(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_log_event(text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_system_push(uuid[], text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.process_premium_expiry_notifications() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_subscriptions() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_premium_subscription(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_premium_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_session_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_session_host(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_friend_profile(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_viral_song_events(text, text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_profile_by_share_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_count() FROM PUBLIC, anon;

-- Re-grant to authenticated where the app actually needs them
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_listening_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_event(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_premium_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_session_host(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_viral_song_events(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_profile_by_share_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_count() TO authenticated;
-- check_and_increment_rate_limit is called from edge functions only (service role)
-- notify_system_push / process_premium_expiry_notifications / expire_old_subscriptions
--   are called from triggers / cron only; no public grant needed.