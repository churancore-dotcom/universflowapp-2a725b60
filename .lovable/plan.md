# Universflow — "Fix everything" pass

This is one big pass touching audio, search, home, admin UI, native playback, and DB security. I'll ship it as one cohesive update so nothing half-lands.

## 1. Security linter (DB)
- Run `supabase--linter`, then in a single migration:
  - Tighten any tables flagged with permissive `USING (true)` SELECTs that contain user data.
  - Add `REVOKE EXECUTE ... FROM anon, public` on sensitive `SECURITY DEFINER` functions (`redeem_promo_code`, `join_listening_session`, `notify_system_push`, `process_premium_expiry_notifications`, `admin_log_event`, `expire_old_subscriptions`, `check_and_increment_rate_limit`, `grant_premium_on_approval`).
  - Keep `has_role`, `has_premium_subscription`, `is_premium_user`, `find_profile_by_share_code`, `get_user_count`, `get_friend_profile`, `get_viral_song_events` callable by `authenticated` only (never `anon`) where appropriate.
- Fix any "Function Search Path Mutable" warnings still showing.

## 2. Real 8D audio + EQ stability rewrite (`src/lib/audioEngine.ts`)
Rebuild the graph cleanly to stop clicks/warble:

```text
<audio> → MediaElementSource → [EQ band 0..7] → bassShelf → preGain
        → convolver(wet) ⟶ wetGain ┐
        → dryGain ─────────────────┤→ stereoPanner (LFO) → limiter → destination
```

- **EQ**: 8× BiquadFilter (peaking), gain clamped ±6 dB, `setTargetAtTime(value, t, 0.05)` for every change.
- **Bass boost**: low-shelf 80 Hz, max +4 dB.
- **Limiter**: DynamicsCompressor with `threshold=-1, knee=0, ratio=20, attack=0.003, release=0.1` (true brickwall, prevents the clipping warble).
- **Reverb**: Convolver with a deterministic 1.6 s exponential-decay stereo IR generated once and cached.
- **8D mode (Auto-rotate, single toggle)**: replace HRTF Panner (which was glitching on non-CORS streams) with `StereoPannerNode`. LFO via `OscillatorNode` (sine, 0.18 Hz) → `GainNode(0.95)` → `stereoPanner.pan`. Wet gain auto-set to 0.25 when 8D on.
- **Ramp-safe transitions**: every param uses `setTargetAtTime` with `0.06` time constant, no `setValueAtTime` jumps.
- **CORS guard**: if MediaElementSource throws (tainted stream), bypass the entire chain instead of leaving a half-built graph (current bug source).
- Persist `spatialAudio: boolean` only — drop the unused panSpeed/width/reverbMix sliders for now (per user "auto-rotate, no extra knobs").

## 3. Equalizer modal
- Show only: 8 EQ band sliders, Bass Boost, Reverb Mix, single "8D Audio" toggle.
- Premium gate stays. Reset button. Live preview only when premium + audio attached.

## 4. Admin sheet auto-open bug
- The `Sheet` (sidebar) in `AdminLayout` has `open` bound to a state that toggles on every route change. Switch to "open only on hamburger click" — i.e. `setOpen(false)` on `useEffect([location.pathname])` instead of leaving `defaultOpen` truthy.

## 5. Auth logo halo (white edges)
- Source PNG has anti-aliased white pixels around the circle. In `Auth.tsx` switch from `mix-blend-screen` (which makes light edges glow on dark bg) to a clean `<img class="rounded-full">` with no blend mode and a soft inner shadow ring. Also add `background: black` behind the logo so the AA fades into black, not the page gradient.

## 6. Background playback (Web + Native)
**Web/PWA (`PlayerContext` + new `useMediaSession` audit):**
- Set `audio.preload="auto"`, never call `audio.pause()` from `visibilitychange`.
- Re-acquire Wake Lock on `visibilitychange → visible`.
- Wire **all** MediaSession action handlers: `play`, `pause`, `previoustrack`, `nexttrack`, `seekto`, `stop` — currently `play`/`pause` are missing the `audio.play().catch()` retry, so OS controls silently fail when the tab is backgrounded.

**Native (`android-native/java/MediaNotificationService.java`):**
- Make the service `START_STICKY` foreground (it's currently `START_NOT_STICKY` so Android kills it).
- Hold a `MediaSessionCompat` with `ACTION_PLAY | PAUSE | SKIP_NEXT | SKIP_PREVIOUS | SEEK_TO` and forward to the JS bridge via `WidgetBridgePlugin.notifyListeners('mediaAction', ...)`.
- In `PlayerContext`, listen for `mediaAction` events and call `play/pause/next/prev`.

## 7. Home one-shot caching
- New `src/lib/homeFeedCache.ts` — module-level Map<sectionKey, { data, ts }>.
- `Home.tsx` reads from cache on mount; only fetches if cache empty.
- `PullToRefresh` callback clears cache + refetches.
- Switching tabs / navigating away never refetches.

## 8. Search fixes
- Remove "Artists" result row entirely from `Search.tsx`.
- When a song is tapped from Library / Liked / Downloads, route directly to `playSong(song)` from `PlayerContext` — currently it goes through a re-resolve step that fails for external streams. Fix by detecting `song.source === 'catalog' | 'external' | 'offline'` and skipping resolution if URL already present.
- Recent searches: persist last 20 in localStorage, show full list (currently capped at 5) in the empty state.

## 9. Real trending / viral
- `CountryViralSection` + `GlobalTopTracksSection`: drop mock fallback. If `get_viral_song_events` returns < 5 rows, fall back to `yt-music-search` with hot queries (`trending hindi 2026`, `viral songs this week`, country-localised) instead of static JSON.
- New edge function call path: `yt-music-search` already exists — extend to accept `mode: 'trending' | 'viral'` and return Last.fm chart top tracks merged with YouTube top results.

## 10. Memory updates
- Update `mem://technical/audio-engine-architecture` with new graph + 8D StereoPanner LFO design.
- Add `mem://features/home-feed-cache` describing the one-shot cache + pull-to-refresh.

---

### Files I'll touch
- `supabase/migrations/<new>.sql`
- `src/lib/audioEngine.ts` (rewrite)
- `src/components/EqualizerModal.tsx` (simplify)
- `src/pages/admin/AdminLayout.tsx` (sheet fix)
- `src/pages/Auth.tsx` (logo)
- `src/contexts/PlayerContext.tsx` + `src/hooks/useMediaSession.ts` (background playback)
- `android-native/java/MediaNotificationService.java` (sticky foreground + media session actions)
- `src/lib/homeFeedCache.ts` (new) + `src/pages/Home.tsx`
- `src/pages/Search.tsx` + `src/pages/Library.tsx` (instant play, no artists row, 20 recent)
- `src/components/CountryViralSection.tsx` + `src/components/GlobalTopTracksSection.tsx` + `supabase/functions/yt-music-search/index.ts`

### Honest call-outs (developer to developer)
- The native sticky-service change won't take effect until you do a fresh APK build via the GitHub Action — Lovable preview is web-only.
- Background playback in mobile **browsers** (not the APK) is at the mercy of the OS; Chrome on Android with screen off works, iOS Safari only with user gesture + MediaSession. I'll wire it correctly but Apple's policy is the ceiling.
- The 8D effect with `StereoPannerNode` works on **every** stream (CORS or not, because it runs after MediaElementSource which only fails on tainted streams — handled with bypass). HRTF (true binaural) requires CORS-clean streams; YouTube/Invidious streams are tainted, so HRTF was the source of the "glitchy 8D" you heard. StereoPanner LFO is the industry-standard "8D audio" trick on YouTube/TikTok and is what you actually want.
- Search relevance for "hindi sad song" depends on YouTube Data API quota. If quota is hit mid-day, fallback chain (Last.fm → Audius) takes over but quality drops. Long-term you may want to add a paid yt-dlp proxy.

Approve and I ship it.
