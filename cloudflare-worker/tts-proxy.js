// ============================================================
//  KidMove Learn — Thai TTS Proxy (Cloudflare Worker)
//
//  Deploy ฟรีที่ https://workers.cloudflare.com
//  หลัง deploy ได้ URL เช่น:
//    https://kidmove-tts.YOUR-NAME.workers.dev
//
//  แล้วเปลี่ยน PROXY_URL ใน audio-manager.js ให้ชี้มาที่ Worker นี้
// ============================================================

export default {
  async fetch(request, env, ctx) {
    // Allow CORS from GitHub Pages only (or "*" for all)
    const ALLOWED_ORIGIN = 'https://pepsproduction.github.io';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse the ?q=TEXT&len=N params from our game
    const url    = new URL(request.url);
    const text   = url.searchParams.get('q');
    const lang   = url.searchParams.get('lang') || 'th';

    if (!text) {
      return new Response('Missing ?q= parameter', { status: 400 });
    }

    // Build Google TTS URL
    const ttsUrl = new URL('https://translate.google.com/translate_tts');
    ttsUrl.searchParams.set('ie', 'UTF-8');
    ttsUrl.searchParams.set('q', text);
    ttsUrl.searchParams.set('tl', lang);
    ttsUrl.searchParams.set('client', 'tw-ob');
    ttsUrl.searchParams.set('prev', 'input');
    ttsUrl.searchParams.set('total', '1');
    ttsUrl.searchParams.set('idx', '0');
    ttsUrl.searchParams.set('textlen', String(text.length));

    // Fetch from Google (server-to-server — always allowed)
    let googleResp;
    try {
      googleResp = await fetch(ttsUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': 'audio/webm,audio/mpeg,audio/*;q=0.8',
        },
      });
    } catch (e) {
      return new Response(`Google TTS fetch error: ${e.message}`, { status: 502 });
    }

    if (!googleResp.ok) {
      return new Response(`Google TTS returned ${googleResp.status}`, { status: googleResp.status });
    }

    // Stream audio back to browser with CORS headers
    const headers = new Headers({
      'Content-Type': googleResp.headers.get('Content-Type') || 'audio/mpeg',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Cache-Control': 'public, max-age=3600',
    });

    return new Response(googleResp.body, { status: 200, headers });
  },
};
