# 🎵 UniversFlow - Complete Music Streaming App Rebuild Prompt

## App Overview
Build a **mobile-first music streaming application** called "UniversFlow" with Apple Music-inspired dark theme aesthetics. The app is constrained to a 390px mobile viewport and features a comprehensive admin panel, premium subscription system, offline playback, social features, and advanced audio controls.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** with custom design tokens
- **Framer Motion** for animations
- **React Router v6** for routing
- **TanStack Query (React Query)** for data fetching
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Sonner** for toast notifications
- **Recharts** for analytics charts

### Backend (Supabase)
- **Supabase** for authentication, database, and storage
- **PostgreSQL** database with RLS policies
- **Supabase Auth** with email/password
- **Supabase Storage** for music files and cover art
- **Edge Functions** for server-side logic

### Mobile/PWA
- **Capacitor** for native Android/iOS builds
- **PWA** with service worker and offline support
- **MediaSession API** for lock screen controls
- **Median.co bridge** for native app features

---

## 🎨 Design System

### Color Palette (Dark Theme - Apple Music Inspired)
```css
/* Core Colors - All HSL */
--background: 0 0% 0%;           /* Pure black */
--foreground: 0 0% 98%;          /* Almost white */
--card: 0 0% 7%;                 /* Dark card */
--primary: 350 100% 60%;         /* Rose/Red (#FF2D55) */
--accent: 330 100% 65%;          /* Pink/Magenta */
--muted: 0 0% 15%;
--muted-foreground: 0 0% 55%;
--destructive: 0 85% 60%;

/* Gradient Colors */
--gradient-start: 350 100% 60%;  /* Rose */
--gradient-mid: 330 100% 65%;    /* Pink */
--gradient-end: 280 100% 65%;    /* Purple */

/* Glass Effect */
--glass-bg: 0 0% 8% / 0.85;
--glass-border: 0 0% 100% / 0.08;
--glass-blur: 40px;
```

### Typography
- **Primary Font**: SF Pro Display, SF Pro Text, Inter, system-ui
- **Font Features**: -webkit-font-smoothing: antialiased

### UI Components Style
- Rounded corners: `rounded-2xl` to `rounded-3xl`
- Glassmorphism: `backdrop-blur-xl` with 8% white border
- Active states: `scale(0.95)` transform
- Minimum touch target: 48px height
- Haptic feedback on interactions

---

## 📱 App Structure & Routes

### Public Routes
- `/auth` - Login/Signup page
- `/add-friend/:shareCode` - Friend referral link (public)

### Protected Routes (Require Authentication)
- `/home` - Main home feed
- `/search` - Search songs, artists, albums
- `/library` - User's library (Liked, Playlists, Artists, Downloads)
- `/playlist/:id` - Playlist detail page
- `/artist/:artistId` - Artist profile page
- `/profile` - User profile with premium status
- `/settings` - App settings
- `/support` - Donation/support page
- `/offline` - Offline downloads page

### Admin Routes (Require Admin Role)
All under `/admin/*`:
- `/admin` - Dashboard with stats
- `/admin/upload` - Upload music (direct file or YouTube URL)
- `/admin/songs` - Manage all songs
- `/admin/artists` - Manage artists
- `/admin/albums` - Manage albums
- `/admin/playlists` - Manage playlists
- `/admin/users` - Manage users and permissions
- `/admin/subscriptions` - Manage user subscriptions
- `/admin/donations` - View donation history
- `/admin/app-settings` - App branding and maintenance mode
- `/admin/features` - Feature flags (downloads, comments, ads, etc.)
- `/admin/announcements` - Create/manage announcements
- `/admin/moderation` - Content moderation queue
- `/admin/analytics` - Usage analytics
- `/admin/logs` - Activity logs
- `/admin/bulk` - Bulk actions on content
- `/admin/health` - System health monitoring
- `/admin/scheduler` - Content scheduling
- `/admin/backup` - Backup and export data
- `/admin/promo-codes` - Generate and manage promo codes
- `/admin/settings` - Admin-specific settings
- `/admin/api` - API key management
- `/admin/notifications` - Push notification management
- `/admin/revenue` - Revenue analytics with charts
- `/admin/engagement` - User engagement metrics (DAU/WAU)
- `/admin/ab-testing` - A/B experiment management
- `/admin/security` - Security center and audit logs

---

## 🗄️ Database Schema (Supabase/PostgreSQL)

### Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,  -- For friend referrals
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `songs`
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artist_id UUID REFERENCES artists(id),
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration INTEGER DEFAULT 0,
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  bitrate INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  cover_size BIGINT DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT false,
  show_in_new_releases BOOLEAN DEFAULT false,
  show_in_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `artists`
```sql
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  genre TEXT,
  is_premium_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `albums`
```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  release_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `playlists`
```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  user_id UUID,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `playlist_songs`
```sql
CREATE TABLE playlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id),
  song_id UUID REFERENCES songs(id),
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_library` (Liked Songs)
```sql
CREATE TABLE user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID REFERENCES songs(id),
  added_at TIMESTAMPTZ DEFAULT now()
);
```

#### `recently_played`
```sql
CREATE TABLE recently_played (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID REFERENCES songs(id),
  played_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_subscriptions`
```sql
CREATE TYPE subscription_platform AS ENUM ('android', 'ios', 'web', 'donation');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE subscription_type AS ENUM ('free', 'premium_monthly', 'premium_yearly');

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_type subscription_type DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  platform subscription_platform DEFAULT 'web',
  expires_at TIMESTAMPTZ,
  purchase_token TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `promo_codes`
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `code_redemptions`
```sql
CREATE TABLE code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  promo_code_id UUID REFERENCES promo_codes(id),
  redeemed_at TIMESTAMPTZ DEFAULT now()
);
```

#### `friends`
```sql
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, accepted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `song_dedications`
```sql
CREATE TABLE song_dedications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  song_id UUID NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `song_reactions`
```sql
CREATE TABLE song_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID REFERENCES songs(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `song_comments`
```sql
CREATE TABLE song_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID REFERENCES songs(id),
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `donations`
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform TEXT NOT NULL,  -- kofi, buymeacoffee, etc.
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `announcements`
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',  -- info, warning, success
  target_audience TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `content_reports`
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  content_type TEXT NOT NULL,  -- song, comment, playlist
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',  -- pending, reviewed, resolved
  action_taken TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `app_settings`
```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}',
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Storage Buckets
- `music` - Audio files (public)
- `covers` - Cover art images (public)

---

## 🎵 Core Features Implementation

### 1. Music Player System

#### PlayerContext (Global State)
```typescript
interface PlayerContextType {
  // Current playback state
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;  // 0-100
  duration: number;  // seconds
  volume: number;    // 0-1
  
  // Queue management
  queue: Song[];
  queueIndex: number;
  
  // Playback modes
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  
  // Actions
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  
  // UI state
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  
  // Ads (for free users)
  showPrerollAd: boolean;
  onPrerollAdComplete: () => void;
}
```

#### MiniPlayer Component
- Fixed at bottom (z-index 40), above BottomNav
- Glassmorphism background with 50px blur
- Shows: Album art, title, artist, play/pause button, progress bar
- Swipe gestures:
  - Swipe UP → Expand to fullscreen
  - Swipe LEFT → Next track
  - Swipe RIGHT → Previous track
- Smooth entrance animation (scale + blur transition)
- Hides on scroll down, shows on scroll up

#### FullscreenPlayer Component
- Full viewport height, dark gradient background
- Large album art (85vw, max 340px)
- Song info: title, artist (links to artist page)
- Progress slider with time display
- Controls: shuffle, prev, play/pause, next, repeat
- Additional buttons: like, add to playlist, share, queue drawer
- Audio visualizer (optional, 10fps for performance)
- Blurred album art as background

#### Audio Engine Features
- Dual audio element system for gapless playback
- Crossfade support (configurable duration)
- MediaSession API for lock screen controls
- Pre-roll ads for free users (every 3rd song)
- Premium users bypass ads

### 2. Home Page Sections (Vertical Order)
1. **New Releases** - Horizontal scroll, songs with `show_in_new_releases: true`
2. **Recommended for You** - AI/random recommendations
3. **Featured Artists** - Horizontal scroll of artist cards
4. **Trending** - Songs with `show_in_trending: true`

### 3. Search Page
- Search input with iOS styling
- Real-time search across songs, artists, albums
- Genre filter chips
- Mood filter chips
- Results grouped by type

### 4. Library Page (Tabs)
- **Liked** - User's liked songs from `user_library`
- **Playlists** - User's playlists
- **Artists** - Artists from liked songs
- **Downloads** - Offline downloaded songs

### 5. Offline Mode
- Dedicated `/offline` route
- IndexedDB storage for audio files
- Download queue with progress tracking
- Storage usage statistics
- Shuffle play for downloads
- Auto-detect online/offline status

### 6. Premium/Subscription System
- Free tier: Ads every 3 songs, limited features
- Premium tier: Ad-free, offline downloads, high-quality audio
- Promo code redemption for lifetime access
- Manual premium via Telegram contact (@ERRORMATRIXx)
- Premium badges on profile

### 7. Social Features
- **Friend System**: Share codes, add friends
- **Song Dedications**: Send songs with messages to friends
- **Dedications Inbox**: View received dedications
- **Share Songs**: Instagram, WhatsApp, Twitter, copy link

### 8. Profile Page
- Avatar with premium badge (crown icon)
- Premium status display
- Upgrade/Redeem code buttons
- Listening stats
- Settings link
- Admin panel link (if admin)

---

## 🔧 Advanced Admin Panel Features

### Dashboard
- Total songs, artists, users, plays stats
- Storage usage
- Recent activity
- Quick links to all sections

### Content Management
- **Upload Music**: Direct file upload or YouTube URL extraction
- **Manage Songs**: Edit metadata, toggle visibility, set trending/new releases
- **Manage Artists**: Create/edit artist profiles with photos
- **Manage Albums**: Album organization
- **Manage Playlists**: Featured playlists, public/private

### User Management
- View all users
- Toggle admin permissions
- Manage subscriptions manually
- View user activity

### Monetization
- **Promo Codes**: Generate, track usage, expire codes
- **Subscriptions**: Manual subscription management
- **Donation History**: View all donations

### Analytics & Monitoring
- **Analytics**: Play counts, downloads, user growth
- **User Engagement**: DAU/WAU metrics, feature usage
- **Revenue Analytics**: Subscription/donation revenue charts
- **Activity Logs**: All admin actions logged
- **System Health**: Performance metrics

### Advanced Features
- **Feature Flags**: Toggle app features (downloads, comments, ads, reactions)
- **Announcements**: Push announcements to users
- **Content Moderation**: Review reported content
- **Content Scheduler**: Schedule content releases
- **Bulk Actions**: Mass update songs/artists
- **Backup/Export**: Data export functionality
- **A/B Testing**: Run experiments with variant management
- **API Management**: API key generation and usage tracking
- **Push Notifications**: Send targeted notifications
- **Security Center**: Security event logs, rate limiting, 2FA settings

---

## 📦 Key Components List

### Layout
- `MobileShell` - 390px mobile container
- `BottomNav` - Navigation bar with 5 tabs (Home, Search, Library, Profile, Settings)
- `Footer` - Attribution footer

### Player
- `MiniPlayer` - Floating mini player
- `FullscreenPlayer` - Full screen player
- `QueueDrawer` - Queue management drawer
- `AudioVisualizer` - Audio frequency visualizer
- `AudioFrequencyVisualizer` - Advanced visualizer

### Audio Controls
- `EqualizerModal` - 5-band equalizer with presets
- `AdvancedAudioSettings` - Quality, spatial audio settings
- `SleepTimerModal` - Sleep timer

### Songs
- `SongCard` - Song list item with play button
- `LikeButton` - Heart button for liking
- `DownloadButton` - Download for offline
- `DownloadAllButton` - Batch download
- `SongReactions` - Emoji reactions

### Sections
- `HorizontalSection` - Reusable horizontal scroll section
- `GenreSection` - Genre filter chips
- `MoodSection` - Mood filter chips
- `FeaturedArtistsSection` - Artist cards
- `TopChartsSection` - Chart listings
- `OfflineSection` - Downloads section

### Modals
- `AddToPlaylistModal` - Add song to playlist
- `CreatePlaylistModal` - Create new playlist
- `AddSongsToPlaylistModal` - Add multiple songs
- `ShareSongModal` - Share song
- `SocialShareModal` - Social media sharing
- `SendDedicationModal` - Send song dedication
- `RedeemCodeModal` - Redeem promo code
- `PremiumGate` - Premium feature gate

### Social
- `FriendsManager` - Manage friends
- `DedicationsInbox` - View dedications
- `FriendActivity` - Friend listening activity

### Ads
- `PrerollAd` - Pre-song ad overlay
- `BannerAd` - Banner advertisement
- `InterstitialAd` - Full-screen ad

### Utilities
- `OptimizedImage` - Lazy loading images
- `SplashScreen` - App loading screen
- `PWAInstallBanner` - Install prompt
- `PullToRefresh` - Pull to refresh component
- `OfflineIndicator` - Online/offline status
- `BlurTransition` - Page transitions
- `AnimatedList` - Animated list component

---

## 🪝 Custom Hooks

```typescript
// Authentication
useAuth() - User session and admin status

// Player
usePlayer() - Access player context
useMediaSession() - Lock screen integration
useAudioVisualizer() - Audio analysis

// Data
useLike() - Like/unlike songs
useRecentlyPlayed() - Track play history
usePremium() - Premium subscription status
useOfflineAudio() - IndexedDB audio caching
useSongCache() - Song metadata caching
useImageCache() - Image caching

// UI
useIsMobile() - Mobile detection
useHaptics() - Haptic feedback
usePullToRefresh() - Pull to refresh
useAppSettings() - App settings from DB
useAudioSettings() - Audio quality settings

// External
useMedian() - Median.co native bridge
useNewSongNotification() - Push notifications for new songs
```

---

## 🔐 Security Implementation

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admin checks via `profiles.is_admin`
- Public read for songs, artists, albums
- Authenticated-only for comments

### Admin Verification
```sql
-- Admin check function
CREATE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = $1 AND is_admin = true
  )
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 📱 Mobile-Specific Features

### Touch Interactions
- Minimum 48px touch targets
- Swipe gestures on MiniPlayer
- Swipe-to-delete in queue
- Pull to refresh on lists
- Haptic feedback on all buttons

### Performance Optimizations
- Lazy loading images with Intersection Observer
- IndexedDB for offline caching
- Memoized components with React.memo
- Throttled audio visualizer (10fps)
- Skeleton loaders for async content

### PWA Features
- Service worker for offline
- App manifest for install
- Lock screen media controls
- Background audio playback

### Native App (Capacitor)
- Android/iOS builds
- Native haptics
- Native share dialog
- Status bar styling

---

## 🎯 Animation Specifications

### Page Transitions
- Fade + slide with `AnimatePresence`
- Duration: 200-300ms
- Ease: `[0.25, 0.1, 0.25, 1]`

### Component Animations
- iOS spring bounce: `stiffness: 300, damping: 25`
- Scale on tap: `scale(0.95)`
- MiniPlayer entrance: `y: 60 → 0, opacity: 0 → 1, blur: 10px → 0`

### Scroll Behavior
- MiniPlayer/BottomNav hide on scroll down
- Reappear on scroll up
- Smooth transitions with Framer Motion

---

## 🌐 API Endpoints (Edge Functions)

### `extract-audio`
- Extract audio from YouTube URLs
- Uses Piped/Invidious proxies
- Returns audio stream URL

### `ai-metadata`
- AI-powered metadata extraction
- Uses Gemini for song info

---

## 📝 Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 🚀 Deployment

### Web (Lovable/Vercel)
- Automatic deploys on push
- Preview URLs for testing

### Android (Capacitor)
- GitHub Actions workflow
- Signed APK builds
- App ID: `app.lovable.universflow`

### PWA
- Manifest configuration
- Icons: 192x192, 512x512, maskable variants

---

## 📋 Implementation Checklist

### Phase 1: Core Setup
- [ ] Initialize React + Vite + TypeScript project
- [ ] Configure Tailwind with design tokens
- [ ] Set up Supabase connection
- [ ] Create database schema and RLS policies
- [ ] Implement AuthContext and routes

### Phase 2: Music Player
- [ ] Build PlayerContext with audio engine
- [ ] Create MiniPlayer with swipe gestures
- [ ] Create FullscreenPlayer with all controls
- [ ] Implement queue management
- [ ] Add MediaSession for lock screen

### Phase 3: Core Pages
- [ ] Home page with sections
- [ ] Search with filters
- [ ] Library with tabs
- [ ] Artist detail page
- [ ] Playlist detail page

### Phase 4: User Features
- [ ] Profile page with stats
- [ ] Like/unlike songs
- [ ] Create/manage playlists
- [ ] Download for offline
- [ ] Settings page

### Phase 5: Premium System
- [ ] Subscription table and hooks
- [ ] Promo code redemption
- [ ] PremiumGate component
- [ ] Pre-roll ads for free users

### Phase 6: Social Features
- [ ] Friend system with share codes
- [ ] Song dedications
- [ ] Social sharing

### Phase 7: Admin Panel
- [ ] Admin layout with sidebar
- [ ] Dashboard with stats
- [ ] All management pages (20+ pages)
- [ ] Analytics and monitoring

### Phase 8: Polish
- [ ] Animations and transitions
- [ ] Haptic feedback
- [ ] PWA configuration
- [ ] Performance optimization
- [ ] Error handling

---

## 👤 Credits

**Created by**: SHASHANK YADAV

---

This prompt contains everything needed to rebuild the UniversFlow music streaming app from scratch. Follow the sections in order, implement the database schema first, then build the components and features progressively.
