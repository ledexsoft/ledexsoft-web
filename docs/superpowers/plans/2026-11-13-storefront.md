# Storefront implementation plan

Goal: replace marketing-first catalog with mobile app-like browsing and a local cart handed to CumaShop, not web checkout.
Architecture: static HTML/CSS/JS, public Supabase reads, pure catalog/cart rules, localStorage with safe fallback. No new services, secrets, orders or payments.

- [ ] Verify real catalog/variant and app link contract; preserve exclusions of verified simulation IDs.
- [ ] Write failing pure-rule tests for visibility, currency-safe sorting, cart validation, URL roundtrip and unavailable items.
- [ ] Implement compact sticky search, location/section/category filters, product detail dialog, favorites, local cart and accessible mobile navigation.
- [ ] Implement cart transfer only with validated shared contract; prices/stock must be revalidated by app.
- [ ] Test network/error/empty states, keyboard dialogs, narrow mobile layout, persistence, copy fallback and navigation.
- [ ] Review, commit only scoped files and verify deployed revision when publication authorized.

Review risks: stale product stock, missing variants, mixed currency totals, corrupted localStorage/URL, async stale detail response. Existing changes to homepage/legal pages are unrelated and preserved.
