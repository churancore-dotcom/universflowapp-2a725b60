// Applies the saved theme tokens to :root BEFORE React mounts.
// This guarantees the theme persists across reloads and is consistent
// across every page (not just Settings).
//
// Each theme defines a COMPLETE token set so no element renders unstyled
// in any mode (Pearl/white especially).

type ThemeMode = 'default' | 'light' | 'black' | 'sunset' | 'ocean' | 'midnight-gold';

interface ThemeTokens {
  background: string; foreground: string;
  card: string; cardForeground: string;
  muted: string; mutedForeground: string;
  popover: string; popoverForeground: string;
  secondary: string; secondaryForeground: string;
  border: string; input: string;
  primary: string; primaryForeground: string;
  accent: string; accentForeground: string;
  ring: string;
  destructive: string; destructiveForeground: string;
  // Sidebar / chart tokens (used by some shadcn primitives)
  sidebar: string; sidebarForeground: string;
  sidebarPrimary: string; sidebarPrimaryForeground: string;
  sidebarAccent: string; sidebarAccentForeground: string;
  sidebarBorder: string; sidebarRing: string;
  bodyBg: string;
  // For meta theme-color (status bar)
  statusBar: string;
}

export const THEMES: Record<ThemeMode, ThemeTokens> = {
  // ====== Obsidian — refined deep black + neon rose (default) ======
  default: {
    background: '0 0% 0%', foreground: '0 0% 98%',
    card: '0 0% 7%', cardForeground: '0 0% 98%',
    muted: '0 0% 14%', mutedForeground: '0 0% 60%',
    popover: '0 0% 9%', popoverForeground: '0 0% 98%',
    secondary: '0 0% 11%', secondaryForeground: '0 0% 98%',
    border: '0 0% 16%', input: '0 0% 12%',
    primary: '350 100% 60%', primaryForeground: '0 0% 100%',
    accent: '330 100% 65%', accentForeground: '0 0% 100%',
    ring: '350 100% 60%',
    destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
    sidebar: '0 0% 5%', sidebarForeground: '0 0% 95%',
    sidebarPrimary: '350 100% 60%', sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '0 0% 12%', sidebarAccentForeground: '0 0% 95%',
    sidebarBorder: '0 0% 14%', sidebarRing: '350 100% 60%',
    bodyBg: '#000',
    statusBar: '#000000',
  },
  // ====== Pearl — TRUE crisp white, fully fixed ======
  light: {
    background: '0 0% 100%', foreground: '240 10% 8%',
    card: '0 0% 100%', cardForeground: '240 10% 8%',
    muted: '240 6% 96%', mutedForeground: '240 5% 38%',
    popover: '0 0% 100%', popoverForeground: '240 10% 8%',
    secondary: '240 6% 97%', secondaryForeground: '240 10% 8%',
    border: '240 6% 90%', input: '240 6% 94%',
    primary: '350 100% 50%', primaryForeground: '0 0% 100%',
    accent: '330 95% 56%', accentForeground: '0 0% 100%',
    ring: '350 100% 50%',
    destructive: '0 75% 52%', destructiveForeground: '0 0% 100%',
    sidebar: '0 0% 100%', sidebarForeground: '240 10% 8%',
    sidebarPrimary: '350 100% 50%', sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '240 6% 96%', sidebarAccentForeground: '240 10% 8%',
    sidebarBorder: '240 6% 88%', sidebarRing: '350 100% 50%',
    bodyBg: '#ffffff',
    statusBar: '#ffffff',
  },
  // ====== Onyx — pure black (OLED) ======
  black: {
    background: '0 0% 0%', foreground: '0 0% 98%',
    card: '0 0% 4%', cardForeground: '0 0% 98%',
    muted: '0 0% 8%', mutedForeground: '0 0% 58%',
    popover: '0 0% 5%', popoverForeground: '0 0% 98%',
    secondary: '0 0% 7%', secondaryForeground: '0 0% 98%',
    border: '0 0% 11%', input: '0 0% 7%',
    primary: '350 100% 60%', primaryForeground: '0 0% 100%',
    accent: '330 100% 65%', accentForeground: '0 0% 100%',
    ring: '350 100% 60%',
    destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
    sidebar: '0 0% 0%', sidebarForeground: '0 0% 95%',
    sidebarPrimary: '350 100% 60%', sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '0 0% 8%', sidebarAccentForeground: '0 0% 95%',
    sidebarBorder: '0 0% 10%', sidebarRing: '350 100% 60%',
    bodyBg: '#000',
    statusBar: '#000000',
  },
  // ====== Sunset Velvet — warm orange × magenta on espresso ======
  sunset: {
    background: '20 28% 5%', foreground: '30 30% 97%',
    card: '20 30% 9%', cardForeground: '30 30% 97%',
    muted: '20 20% 15%', mutedForeground: '25 18% 65%',
    popover: '20 30% 10%', popoverForeground: '30 30% 97%',
    secondary: '20 26% 13%', secondaryForeground: '30 30% 97%',
    border: '20 22% 18%', input: '20 25% 13%',
    primary: '14 100% 60%', primaryForeground: '0 0% 100%',
    accent: '330 95% 60%', accentForeground: '0 0% 100%',
    ring: '14 100% 60%',
    destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
    sidebar: '20 30% 7%', sidebarForeground: '30 30% 95%',
    sidebarPrimary: '14 100% 60%', sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '20 26% 13%', sidebarAccentForeground: '30 30% 95%',
    sidebarBorder: '20 22% 16%', sidebarRing: '14 100% 60%',
    bodyBg: '#180e09',
    statusBar: '#180e09',
  },
  // ====== Aurora — deep ocean × neon cyan/teal ======
  ocean: {
    background: '215 50% 5%', foreground: '210 30% 97%',
    card: '215 45% 9%', cardForeground: '210 30% 97%',
    muted: '215 25% 15%', mutedForeground: '210 18% 65%',
    popover: '215 45% 10%', popoverForeground: '210 30% 97%',
    secondary: '215 30% 13%', secondaryForeground: '210 30% 97%',
    border: '215 25% 19%', input: '215 28% 13%',
    primary: '195 100% 55%', primaryForeground: '215 50% 5%',
    accent: '170 90% 55%', accentForeground: '215 50% 5%',
    ring: '195 100% 55%',
    destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
    sidebar: '215 50% 6%', sidebarForeground: '210 30% 95%',
    sidebarPrimary: '195 100% 55%', sidebarPrimaryForeground: '215 50% 5%',
    sidebarAccent: '215 30% 13%', sidebarAccentForeground: '210 30% 95%',
    sidebarBorder: '215 25% 18%', sidebarRing: '195 100% 55%',
    bodyBg: '#040a14',
    statusBar: '#040a14',
  },
  // ====== Midnight Gold — luxe navy × warm gold ======
  'midnight-gold': {
    background: '240 14% 4%', foreground: '40 25% 97%',
    card: '240 14% 8%', cardForeground: '40 25% 97%',
    muted: '240 10% 13%', mutedForeground: '40 8% 62%',
    popover: '240 14% 10%', popoverForeground: '40 25% 97%',
    secondary: '240 10% 11%', secondaryForeground: '40 25% 97%',
    border: '240 12% 17%', input: '240 12% 11%',
    primary: '42 95% 58%', primaryForeground: '240 14% 4%',
    accent: '36 88% 60%', accentForeground: '240 14% 4%',
    ring: '42 95% 58%',
    destructive: '0 84% 60%', destructiveForeground: '0 0% 100%',
    sidebar: '240 14% 5%', sidebarForeground: '40 25% 95%',
    sidebarPrimary: '42 95% 58%', sidebarPrimaryForeground: '240 14% 4%',
    sidebarAccent: '240 10% 11%', sidebarAccentForeground: '40 25% 95%',
    sidebarBorder: '240 12% 16%', sidebarRing: '42 95% 58%',
    bodyBg: '#06070d',
    statusBar: '#06070d',
  },
};

export const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  const t = THEMES[theme] || THEMES.default;

  // Toggle .light class on <html> for any CSS that gates on it
  if (theme === 'light') root.classList.add('light');
  else root.classList.remove('light');

  // Core surface tokens
  root.style.setProperty('--background', t.background);
  root.style.setProperty('--foreground', t.foreground);
  root.style.setProperty('--card', t.card);
  root.style.setProperty('--card-foreground', t.cardForeground);
  root.style.setProperty('--muted', t.muted);
  root.style.setProperty('--muted-foreground', t.mutedForeground);
  root.style.setProperty('--popover', t.popover);
  root.style.setProperty('--popover-foreground', t.popoverForeground);
  root.style.setProperty('--secondary', t.secondary);
  root.style.setProperty('--secondary-foreground', t.secondaryForeground);
  root.style.setProperty('--border', t.border);
  root.style.setProperty('--input', t.input);

  // Brand
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-foreground', t.primaryForeground);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-foreground', t.accentForeground);
  root.style.setProperty('--ring', t.ring);
  root.style.setProperty('--destructive', t.destructive);
  root.style.setProperty('--destructive-foreground', t.destructiveForeground);

  // Sidebar
  root.style.setProperty('--sidebar-background', t.sidebar);
  root.style.setProperty('--sidebar-foreground', t.sidebarForeground);
  root.style.setProperty('--sidebar-primary', t.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', t.sidebarPrimaryForeground);
  root.style.setProperty('--sidebar-accent', t.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', t.sidebarAccentForeground);
  root.style.setProperty('--sidebar-border', t.sidebarBorder);
  root.style.setProperty('--sidebar-ring', t.sidebarRing);

  // Glow + gradient helpers used across components
  root.style.setProperty('--glow-primary', t.primary);
  root.style.setProperty('--glow-accent', t.accent);
  root.style.setProperty('--gradient-start', t.primary);
  root.style.setProperty('--gradient-mid', t.accent);

  document.body.style.background = t.bodyBg;
  document.documentElement.style.background = t.bodyBg;

  // Update status-bar / browser theme color
  try {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = t.statusBar;
  } catch { /* ignore */ }

  try { localStorage.setItem('uf_theme', theme); } catch { /* ignore */ }
};

export type { ThemeMode };

// Run immediately on import — before React mounts.
try {
  const saved = (localStorage.getItem('uf_theme') as ThemeMode) || 'default';
  applyTheme(saved);
} catch {
  applyTheme('default');
}
