// ================================================================
//  KidMove Learn — Thai TTS Proxy  (Cloudflare Worker)
//
//  วิธีใช้งาน (ไม่ต้องใช้ wrangler):
//  1. ไปที่  https://workers.cloudflare.com  แล้วสมัคร / Login
//  2. กด  "Create a Worker"
//  3. ลบโค้ดเดิมทั้งหมดในช่อง Editor ทางซ้าย
//  4. Copy โค้ดทั้งหมดนี้  แล้ว Paste ลงในช่อง Editor
//  5. กด "Deploy"
//  6. Cloudflare จะให้ URL เช่น:
//       https://kidmove-tts.YOUR-NAME.workers.dev
//  7. ส่ง URL นั้นให้ Antigravity เพื่ออัปเดตเกม
// ================================================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const ALLOWED_ORIGIN = 'https://pepsproduction.github.io';

  // Handle CORS preflight (OPTIONS)
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

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Parse query params:  ?q=TEXT&lang=th
  const url  = new URL(request.url);
  const text = url.searchParams.get('q');
  const lang = url.searchParams.get('lang') || 'th';

  if (!text) {
    return new Response('Missing ?q= parameter', { status: 400 });
  }

  // Build the Google Translate TTS URL
  const ttsUrl = 'https://translate.google.com/translate_tts'
    + '?ie=UTF-8'
    + '&q=' + encodeURIComponent(text)
    + '&tl=' + lang
    + '&client=tw-ob'
    + '&prev=input'
    + '&total=1'
    + '&idx=0'
    + '&textlen=' + text.length;

  // Fetch from Google server-to-server (always allowed by Google)
  let googleResp;
  try {
    googleResp = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/webm,audio/mpeg,audio/*;q=0.8,*/*;q=0.5',
        'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
      },
    });
  } catch (e) {
    return new Response('Google TTS fetch failed: ' + e.message, { status: 502 });
  }

  if (!googleResp.ok) {
    return new Response('Google TTS error: HTTP ' + googleResp.status, { status: googleResp.status });
  }

  // Return audio to browser with CORS headers
  const contentType = googleResp.headers.get('Content-Type') || 'audio/mpeg';
  return new Response(googleResp.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
