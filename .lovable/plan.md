## Full overhaul — phased plan

Goal: ship a real cherry-on-top without breaking the working app. Phased so each batch is reviewable and previewable independently.

---

### Phase 1 — Fix the 403/500 upload + ship Powerlook-style multi-image + variants **[COMPLETED]**

- Added variant schema fields to Product model
- Implemented robust memoryStorage Cloudinary streaming helper with file-filter magic-byte validation
- Rewrote frontend upload workflows with multi-file dropzones and variants mapping tables
- Strengthened backend error handling for upload and authentication edge cases

---

### Phase 2 — Backend DRY + validation + perf **[COMPLETED]**

- Centralized validator schemas with Zod and implemented request validation middleware across all route groups
- Integrated generic CRUD Controller Factory to shrink controller boilerplate
- Standardized Mongo indexes on Products, Categories, Orders, and Users models
- Integrated `lru-cache` to protect in-memory cache layer from heap leaks
- Optimized user/vendor lookups using MongoDB lookup pipelines to eliminate N+1 queries
- Standardized API response payloads and aligned testing assertions

---

### Phase 3 — Auth (Login/Register) polish **[COMPLETED]**

- Reimplemented Login and Register pages using `react-hook-form` + `zod`
- Added input validation feedback, CapsLock detection, show/hide toggle
- Implemented live Password Strength Indicator (0-4 scoring) with custom progress bar
- Surfaced specific server errors directly inside form alerts
- Added "Remember my email" checkbox (utilizing local storage for email persistence)

---

### Phase 4 — Navbar / Footer / Home polish **[IN PROGRESS]**

- Navbar: sticky on scroll, mega-menu for categories (hover desktop / accordion mobile), search with autosuggest (debounced), cart/wishlist counters with bounce animation, profile dropdown.
- Mobile: slide-in drawer, bottom-tab bar (Home/Shop/Cart/Profile) for app-like feel.
- Home: hero carousel autoplay+pause-on-hover, category grid with hover zoom, "New Arrivals" rail (horizontal scroll-snap), trust badges row, newsletter section, polished footer with social + payment icons.
- Skeleton states everywhere data loads.
- All animations via Framer Motion, respect `prefers-reduced-motion`.

---

### Phase 5 — Tests + docs **[IN PROGRESS]**

- Test suite aligned and passing (20/20 test cases).
- Ensure integration and business-logic validation.
- DEVELOPER_GUIDE.md setup instructions.