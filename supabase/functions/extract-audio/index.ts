import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of public cobalt API instances (community-maintained, updated for v11 API)
// These instances are from https://instances.cobalt.best/ and support the new API format
const COBALT_INSTANCES = [
  'https://cobalt-api.meowing.de',
  'https://cobalt-backend.canine.tools',
  'https://kityune.imput.net',
  'https://nachos.imput.net',
  'https://sun.imput.net',
];

interface CobaltResponse {
  status: 'tunnel' | 'redirect' | 'picker' | 'error' | 'local-processing';
  url?: string;
  filename?: string;
  error?: { code: string; context?: { service?: string; limit?: number } };
  picker?: Array<{ url: string; type: string }>;
  audio?: string;
  audioFilename?: string;
}

async function tryExtractWithInstance(instanceUrl: string, mediaUrl: string): Promise<CobaltResponse | null> {
  try {
    console.log(`Trying cobalt instance: ${instanceUrl}`);
    
    // The v11 API uses the root endpoint, not /api/json
    const response = await fetch(instanceUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'UniversFlow/1.0 (+https://universflowapp.lovable.app)',
      },
      body: JSON.stringify({
        url: mediaUrl,
        downloadMode: 'audio',
        audioFormat: 'mp3',
        audioBitrate: '320',
        filenameStyle: 'basic',
      }),
    });

    console.log(`Instance ${instanceUrl} returned status ${response.status}`);

    if (!response.ok) {
      // Try to get error details
      try {
        const errorData = await response.json();
        console.log(`Error response from ${instanceUrl}:`, JSON.stringify(errorData));
      } catch {
        console.log(`Could not parse error response from ${instanceUrl}`);
      }
      return null;
    }

    const data = await response.json();
    console.log(`Instance ${instanceUrl} response:`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`Error with instance ${instanceUrl}:`, error);
    return null;
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

    // Try each cobalt instance until one works
    let result: CobaltResponse | null = null;
    let lastError: string | null = null;
    
    for (const instance of COBALT_INSTANCES) {
      result = await tryExtractWithInstance(instance, url);
      if (result) {
        if (result.status === 'error') {
          // Store the error but try the next instance
          lastError = result.error?.code || 'Unknown error';
          console.log(`Instance returned error: ${lastError}, trying next...`);
          continue;
        }
        // Got a successful result
        break;
      }
    }

    if (!result || result.status === 'error') {
      const errorMessage = lastError || 'Failed to extract audio. All extraction servers are unavailable or protected.';
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          platform,
          hint: 'Try using a direct audio link instead, or the service may require authentication.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different response types
    let audioUrl: string | null = null;
    let filename = result.filename || 'audio.mp3';

    if (result.status === 'tunnel' || result.status === 'redirect') {
      audioUrl = result.url || null;
    } else if (result.status === 'picker') {
      // For picker responses, check for audio field or find audio in picker items
      if (result.audio) {
        audioUrl = result.audio;
        if (result.audioFilename) {
          filename = result.audioFilename;
        }
      } else if (result.picker) {
        // Find the first audio item or use the first video item
        const audioItem = result.picker.find(item => item.type === 'audio');
        const videoItem = result.picker[0];
        audioUrl = audioItem?.url || videoItem?.url || null;
      }
    } else if (result.status === 'local-processing') {
      // For local-processing, we can't handle this server-side
      return new Response(
        JSON.stringify({ 
          error: 'This content requires local processing which is not supported. Try a different URL or platform.',
          platform,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!audioUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find audio URL in response',
          platform,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully extracted audio: ${audioUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        platform,
        filename,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
