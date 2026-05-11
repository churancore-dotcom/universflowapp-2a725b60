import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string;
  duration?: number;
}

function cleanTitle(raw: string) {
  const cleaned = raw
    .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\s*\(Official\s*Audio\)/gi, '')
    .replace(/\s*\[Official\s*Audio\]/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\[Lyrics?\]/gi, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim();
  const dash = cleaned.match(/^(.+?)\s*[-–—]\s+(.+)$/);
  if (dash) return { artist: dash[1].trim(), title: dash[2].trim() };
  return { artist: '', title: cleaned };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Per-user rate limit (30 req/min) to protect YouTube quota
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: allowed } = await adminClient.rpc('check_and_increment_rate_limit', {
      _user_id: userData.user.id,
      _endpoint: 'yt-music-search',
      _max_per_minute: 30,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, limit: requestedLimit } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'A search query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const limit = Math.max(1, Math.min(50, typeof requestedLimit === 'number' ? requestedLimit : 30));

    // ---------- Try Invidious (Railway) FIRST for fresh results ----------
    const INVIDIOUS_INSTANCES = [
      'https://invidious-production-d29a.up.railway.app',
      'https://inv.nadeko.net',
      'https://invidious.nerdvpn.de',
      'https://iv.datura.network',
      'https://invidious.privacyredirect.com',
    ];

    // sort_by: relevance | upload_date | view_count | rating
    // We pick upload_date when user prefixes "new:" else relevance, BUT bias to recent
    let sortBy = 'relevance';
    let cleanQuery = query.trim();
    if (cleanQuery.toLowerCase().startsWith('new:')) {
      sortBy = 'upload_date';
      cleanQuery = cleanQuery.slice(4).trim();
    }

    let invResults: SearchResult[] = [];
    for (const inst of INVIDIOUS_INSTANCES) {
      try {
        const u = new URL(`${inst}/api/v1/search`);
        u.searchParams.set('q', `${cleanQuery} music`);
        u.searchParams.set('type', 'video');
        u.searchParams.set('sort_by', sortBy);
        u.searchParams.set('date', 'year'); // last year only — keeps results fresh
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(u.toString(), { headers: { Accept: 'application/json' }, signal: ctrl.signal });
        clearTimeout(tm);
        if (!r.ok) continue;
        const items: any[] = await r.json();
        invResults = items
          .slice(0, limit)
          .map((item: any) => {
            const videoId = item?.videoId;
            if (!videoId) return null;
            const parsed = cleanTitle(item.title || 'Unknown Title');
            const thumb = item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url
              || item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url
              || item.videoThumbnails?.[0]?.url;
            const cover_url = thumb?.startsWith('/') ? `${inst}${thumb}` : thumb;
            return {
              id: `ytm-${videoId}`,
              videoId,
              title: parsed.title,
              artist: parsed.artist || item.author || 'Unknown Artist',
              audio_url: `yt-video:${videoId}`,
              cover_url,
              duration: item.lengthSeconds || undefined,
            };
          })
          .filter(Boolean) as SearchResult[];
        if (invResults.length > 0) {
          console.log(`Invidious search OK via ${inst}: ${invResults.length} results`);
          break;
        }
      } catch (e) {
        console.warn(`Invidious search failed on ${inst}:`, (e as Error).message);
      }
    }

    if (invResults.length > 0) {
      return new Response(JSON.stringify({ success: true, results: invResults, source: 'invidious' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---------- Fallback: YouTube Data API ----------
    console.log('Invidious returned 0 results, falling back to YouTube Data API');
    const apiKeys = [
      Deno.env.get('YOUTUBE_API_KEY'),
      Deno.env.get('YOUTUBE_API_KEY_2'),
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'YouTube search service is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data: any = null;
    let lastErr = '';
    for (const apiKey of apiKeys) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('q', `${cleanQuery} music`);
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoCategoryId', '10');
      url.searchParams.set('maxResults', String(limit));
      url.searchParams.set('order', sortBy === 'upload_date' ? 'date' : 'relevance');
      url.searchParams.set('publishedAfter', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (response.ok) {
        data = await response.json();
        break;
      }
      lastErr = await response.text();
      console.warn(`YouTube key failed (${response.status}), trying next...`, lastErr.slice(0, 200));
    }

    if (!data) {
      console.error('All YouTube keys failed:', lastErr);
      return new Response(JSON.stringify({ success: false, error: 'YouTube search is temporarily unavailable' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: SearchResult[] = (data.items || [])
      .map((item: any) => {
        const videoId = item?.id?.videoId;
        if (!videoId) return null;
        const snippet = item.snippet || {};
        const parsed = cleanTitle(snippet.title || 'Unknown Title');
        return {
          id: `ytm-${videoId}`,
          videoId,
          title: parsed.title,
          artist: parsed.artist || snippet.channelTitle || 'Unknown Artist',
          audio_url: `yt-video:${videoId}`,
          cover_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('yt-music-search error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});