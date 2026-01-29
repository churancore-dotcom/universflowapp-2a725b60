
# Complete UniversFlow App Rebuild Prompt

I've thoroughly analyzed the entire codebase and will create an enhanced, comprehensive rebuild specification document. The existing `REBUILD_PROMPT.md` is a good foundation but needs more detailed component code, edge function logic, and specific implementation details.

## Plan Overview

### What I'll Create
A comprehensive technical specification document (`REBUILD_PROMPT.md`) that contains everything needed to rebuild the exact UniversFlow app from scratch. This will be organized into the following sections:

---

## 1. Project Initialization
- React 18 + Vite + TypeScript setup
- Tailwind CSS configuration with custom design tokens
- Framer Motion for animations
- All npm dependencies with exact versions

## 2. Complete Database Schema
- All 16+ tables with full SQL CREATE statements
- All RLS (Row Level Security) policies
- Database functions and triggers
- Storage buckets configuration
- Enum types for subscriptions

## 3. Authentication System
- AuthContext with full implementation
- Email/password signup and login
- Google OAuth integration
- Admin role checking
- Share code generation for friend referrals

## 4. Player Engine Architecture
- PlayerContext with dual audio element system
- Crossfade implementation logic
- Queue management (shuffle, repeat, navigation)
- MediaSession API for lock screen controls
- Pre-roll ad integration for free users

## 5. All Component Specifications

**Layout Components:**
- MobileShell (390px fixed viewport)
- BottomNav (scroll-responsive, glassmorphism)
- MiniPlayer (swipe gestures, progress tracking)
- FullscreenPlayer (album art, controls, reactions)

**Core Components:**
- SongCard, SplashScreen, PWAInstallBanner
- HorizontalSection, FeaturedArtistsSection
- EqualizerModal, QueueDrawer
- OfflineIndicator, PullToRefresh

**Social Components:**
- FriendsManager, DedicationsInbox
- SendDedicationModal, SocialShareModal

**Premium Components:**
- PremiumGate, RedeemCodeModal
- PrerollAd system

## 6. All Pages (20+)
- Auth (Login/Signup with Google)
- Home (sections: New Releases, Recommended, Featured Artists, Trending)
- Search (real-time search, genre/mood filters)
- Library (tabs: Liked, Playlists, Artists, Downloads)
- Profile (premium status, stats, settings)
- Offline (dedicated offline playback page)
- PlaylistDetail, ArtistDetail

## 7. Complete Admin Panel (28 Pages)
- Dashboard with stats and charts
- Upload Music (YouTube extraction + direct upload)
- Manage Songs, Artists, Albums, Playlists, Users
- Subscriptions management
- Promo Codes generator
- Revenue Analytics with Recharts
- User Engagement (DAU/WAU metrics)
- A/B Testing management
- Push Notifications
- API Management
- Security Center
- Feature Flags
- Content Moderation
- System Health monitoring
- Backup/Export tools
- Content Scheduler

## 8. Custom Hooks
- useAuth, usePlayer, usePremium
- useMediaSession, useAudioVisualizer
- useLike, useSongCache, useImageCache
- useOfflineAudio (IndexedDB)
- useHaptics (cross-platform)
- usePullToRefresh
- useAppSettings, useAudioSettings
- useMedian (native bridge)

## 9. Edge Functions
- `extract-audio`: YouTube audio extraction
- `ai-metadata`: AI-powered metadata extraction

## 10. CSS/Styling
- Complete index.css with:
  - Apple Music dark theme CSS variables
  - Glassmorphism classes (.glass, .glass-strong)
  - Gradient text utilities
  - Mobile-only viewport constraints
  - Safe area handling

## 11. Animation System
- Framer Motion spring configurations
- iOS-style bounce animations
- Page transitions
- Scroll-responsive show/hide for nav

## 12. PWA Configuration
- manifest.json specification
- Service worker setup
- Icon sizes (192, 512, maskable variants)

## 13. Capacitor Mobile Build
- Android configuration
- GitHub Actions workflow for APK builds
- Native feature bridges

---

## Technical Specifications Included

### Color Palette (HSL Values)
```text
Background: 0 0% 0% (Pure black)
Primary: 350 100% 60% (Rose/Red - Apple Music style)
Accent: 330 100% 65% (Pink/Magenta)
Muted: 0 0% 15%
Glass Background: rgba(18, 18, 18, 0.75) + blur(40px)
```

### Animation Configs
```text
iOS Spring: stiffness 300, damping 25
iOS Bounce: stiffness 400, damping 30
Scale on tap: 0.95 (buttons), 0.88 (nav items)
MiniPlayer entrance: blur(10px) -> 0, scale(0.95) -> 1
```

### Key Metrics
- Minimum touch target: 48px
- MiniPlayer height: ~72px
- BottomNav height: ~56px
- Bottom padding for content: 140-160px
- Album art in FullscreenPlayer: 85vw, max 340px

---

## What This Document Enables

1. **Another AI** can read this and rebuild the exact same app
2. **Developers** can use it as a technical specification
3. **Project handoff** with complete documentation
4. **Recovery** if the project is lost

The document will be approximately 1500+ lines of comprehensive technical specification.
