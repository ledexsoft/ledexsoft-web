# Cloudflare route for the web development landing

This Worker redirects the landing entry paths. GitHub Pages serves the localized static pages and their assets directly; the Worker passes those requests through unchanged.

## Routing behavior

- Requests from country code `CU` go to `/desarrollo-web/cuba/`.
- Other visitors use the highest-priority language in `Accept-Language` (quality value, then header order). Spanish goes to `/desarrollo-web/es/`; English, another language, or a missing header goes to `/desarrollo-web/en/`.
- The redirect is not cacheable because its destination depends on country and browser language.
- Requests under the route that are not the entry path are passed to the origin with `fetch(request)`; their URL and response are left unchanged.
- Other website routes are outside the Worker route.

## Cloudflare setup

1. In Cloudflare DNS, enable the proxy for the existing `ledexsoft.com` record so the exact Worker routes can receive requests. Keep the existing Pages origin and record target.
2. Review `wrangler.toml`; its route pattern also catches query strings, while the Worker redirects only `/desarrollo-web` and `/desarrollo-web/`.
3. From the repository root, deploy with `npx wrangler deploy --config workers/wrangler.toml` after authenticating Wrangler to the LedexSoft Cloudflare account.
4. Confirm `https://ledexsoft.com/desarrollo-web/` redirects to the expected localized path from a test request or location. The static localized URLs continue to work without the Worker.

The wildcard route is required so entry URLs with query parameters are detected. Localized pages, assets, and other paths under this prefix pass through to GitHub Pages.

## Local preview

The repository's static server can preview `/desarrollo-web/cuba/`, `/desarrollo-web/es/`, and `/desarrollo-web/en/`. `/desarrollo-web/` presents a manual selector because a plain static host cannot read Cloudflare's visitor country code.
