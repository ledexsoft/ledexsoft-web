const ENTRY_PATHS = new Set(['/desarrollo-web', '/desarrollo-web/']);

function parseLanguagePreferences(header) {
  if (!header) return [];

  return header.split(',').map((entry, index) => {
    const [rawTag, ...parameters] = entry.trim().split(';');
    const tag = rawTag.trim().toLowerCase();
    if (!tag) return null;

    let quality = 1;
    const qualityParameter = parameters.find((parameter) => /^\s*q\s*=/i.test(parameter));
    if (qualityParameter) {
      const parsed = Number(qualityParameter.split('=')[1]);
      quality = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
    }

    return { tag, quality, index };
  }).filter((entry) => entry && entry.quality > 0);
}

function chooseGlobalLanguage(header) {
  const preferences = parseLanguagePreferences(header);
  preferences.sort((a, b) => b.quality - a.quality || a.index - b.index);

  const preferredTag = preferences[0]?.tag;
  return preferredTag === 'es' || preferredTag?.startsWith('es-') ? 'es' : 'en';
}

function destinationFor(request) {
  if (request.cf?.country?.toUpperCase() === 'CU') return '/desarrollo-web/cuba/';
  return `/desarrollo-web/${chooseGlobalLanguage(request.headers.get('Accept-Language'))}/`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!ENTRY_PATHS.has(url.pathname)) return fetch(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    url.pathname = destinationFor(request);
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Cache-Control': 'private, no-store, max-age=0',
        Vary: 'Accept-Language',
      },
    });
  },
};
