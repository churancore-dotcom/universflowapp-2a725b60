import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Piped API instances (free, no auth required)
// These provide YouTube audio stream URLs via /streams/:videoId
// Updated list from https://awsmfoss.com/piped/
const PIPED_INSTANCES = [
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://pipedapi.syncpundit.io',
  'https://api-piped.mha.fi',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.rivo.lol',
  'https://pipedapi.colinslegacy.com',
  'https://yapi.vyper.me',
  'https://piped-api.lunar.icu',
  'https://ytapi.dc09.ru',
  'https://watchapi.whatever.social',
  'https://pipedapi.palveluntarjoaja.eu',
  'https://pipedapi.smnz.de',
  'https://pipedapi.qdi.fi',
  'https://piped-api.hostux.net',
  'https://pipedapi.osphost.fi',
  'https://piapi.ggtyler.dev',
];

interface PipedAudioStream {
  url: string;
  bitrate: number;
  mimeType: string;
  quality: string;
  format: string;
}

interface PipedResponse {
  audioStreams?: PipedAudioStream[];
  title?: string;
  uploader?: string;
  duration?: number;
  error?: string;
  message?: string;
}

function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function tryPipedInstance(instanceUrl: string, videoId: string): Promise<{ success: boolean; audioUrl?: string; title?: string; error?: string }> {
  try {
    console.log(`Trying Piped instance: ${instanceUrl}`);
    
    const response = await fetch(`${instanceUrl}/streams/${videoId}`, {
      headers: {
        'User-Agent': 'UniversFlow/1.0 (+https://universflowapp.lovable.app)',
      },
    });

    console.log(`Piped ${instanceUrl} returned status ${response.status}`);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data: PipedResponse = await response.json();
    
    if (data.error || data.message) {
      return { success: false, error: data.error || data.message };
    }

    if (!data.audioStreams || data.audioStreams.length === 0) {
      return { success: false, error: 'No audio streams available' };
    }

    // Find the best audio stream (prefer higher bitrate, MP4/M4A format)
    const sortedStreams = [...data.audioStreams].sort((a, b) => {
      // Prefer M4A/MP4 over WebM for better compatibility
      const aIsM4a = a.mimeType?.includes('mp4') || a.format?.includes('M4A');
      const bIsM4a = b.mimeType?.includes('mp4') || b.format?.includes('M4A');
      if (aIsM4a && !bIsM4a) return -1;
      if (!aIsM4a && bIsM4a) return 1;
      // Then prefer higher bitrate
      return (b.bitrate || 0) - (a.bitrate || 0);
    });

    const bestStream = sortedStreams[0];
    console.log(`Found audio stream: ${bestStream.quality}, ${bestStream.mimeType}`);

    return {
      success: true,
      audioUrl: bestStream.url,
      title: data.title,
    };
  } catch (error) {
    console.error(`Error with Piped instance ${instanceUrl}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

function detectPlatform(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'YouTube';
  if (lowercaseUrl.includes('soundcloud.com')) return 'SoundCloud';
  if (lowercaseUrl.includes('spotify.com')) return 'Spotify';
  if (lowercaseUrl.includes('tiktok.com')) return 'TikTok';
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'Twitter/X';
  if (lowercaseUrl.includes('instagram.com')) return 'Instagram';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.watch')) return 'Facebook';
  if (lowercaseUrl.includes('vimeo.com')) return 'Vimeo';
  if (lowercaseUrl.includes('twitch.tv')) return 'Twitch';
  if (lowercaseUrl.includes('reddit.com')) return 'Reddit';
  if (lowercaseUrl.includes('bilibili.com')) return 'Bilibili';
  return 'Unknown';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracting audio from: ${url}`);
    const platform = detectPlatform(url);
    console.log(`Detected platform: ${platform}`);

    // Check if it's a direct audio URL
    if (url.match(/\.(mp3|wav|flac|aac|ogg|m4a|opus)(\?.*)?$/i)) {
      console.log('Direct audio URL detected, returning as-is');
      return new Response(
        JSON.stringify({
          success: true,
          audioUrl: url,
          platform: 'Direct Link',
          filename: url.split('/').pop()?.split('?')[0] || 'audio.mp3',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle YouTube URLs using Piped/Invidious
    if (platform === 'YouTube') {
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Could not extract YouTube video ID from URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Extracted video ID: ${videoId}`);

      // Try Piped instances first
      for (const instance of PIPED_INSTANCES) {
        const result = await tryPipedInstance(instance, videoId);
        if (result.success && result.audioUrl) {
          return new Response(
            JSON.stringify({
              success: true,
              audioUrl: result.audioUrl,
              platform: 'YouTube',
              filename: result.title ? `${result.title}.m4a` : 'audio.m4a',
              title: result.title,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      // All instances failed
      return new Response(
        JSON.stringify({ 
          error: 'Failed to extract audio from YouTube. All extraction servers are unavailable.',
          platform: 'YouTube',
          hint: 'Try again later or use a direct audio link instead.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For non-YouTube platforms, we currently don't support extraction
    return new Response(
      JSON.stringify({ 
        error: `Audio extraction from ${platform} is not currently supported.`,
        platform,
        hint: 'Please use a direct audio link (MP3, WAV, etc.) or a YouTube link.',
        supportedPlatforms: ['YouTube', 'Direct Links (MP3, WAV, FLAC, M4A, OGG)'],
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in extract-audio function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
