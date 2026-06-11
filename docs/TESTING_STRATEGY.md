# MensVibe — 2026 Testing, Security, & Production‑Readiness Strategy

## Project Overview
The current codebase is a functional demo of an e‑commerce platform built with **Express (Node.js)**, **MongoDB Atlas**, and a **React/Vite** front‑end.  It covers the core flows – authentication, product catalog, cart, checkout, coupons, and Razorpay payment integration.  To transition this demo into a production‑ready, hire‑worthy project we need to solidify **testing**, **security**, **validation**, **observability**, and **deployment**.

---

## 1️⃣ API Testing Checklist (Current Status & Gaps)
| Module | ✅ Implemented | 📌 Gaps / Recommendations |
|--------|----------------|----------------------------|
| **Auth** | Register, Login, Google login, Logout, Me – covered by unit tests (`api‑endpoints.test.js`) and Postman collection. | • Add **password‑strength** validation (min 8 chars, mix of upper/lower, numbers, symbols).  
• Add **account lockout** after 5 failed login attempts (persisted in DB). |
| **Product** | CRUD, pagination, search, filter, image upload – tested. | • Validate **image mime‑type** and **size limits** (≤5 MB).  
• Add **optimistic concurrency** (`__v` version key) to prevent lost updates. |
| **Category / Subcategory** | CRUD + slug generation – tested. | • Enforce **unique slug** across collections (index). |
| **Cart** | Add / Update / Remove / Clear – tested. | • Enforce **max quantity per SKU** (e.g., 10).  
• Reject **negative** or **zero** quantities with clear error code `400`. |
| **Order** | Checkout, stock locking, user/admin views – tested. | • Add **order idempotency key** to make checkout safe for retries.  
• Verify **address format** (PIN 6 digits, city/state validation). |
| **Coupon** | Apply, restrictions, usage count – tested. | • Add **per‑user usage limit** enforcement.  
• Ensure **expiry** is checked server‑side (UTC). |
| **Payment (Razorpay)** | Order creation, signature verification – tested. | • Implement **webhook verification** with HMAC validation and replay‑attack protection. |
| **Misc** | Global error handler, health endpoint – present. | • Add **OpenAPI (Swagger) spec** and generate docs automatically. |

**Action:** Expand the Jest/SuperTest suite to cover all **edge‑case** scenarios listed below and enforce **≥90 % coverage** (use `nyc`/`c8`).  Add CI step to fail builds if coverage drops.

---

## 2️⃣ Security Audit (Current Status & Enhancements)
| Area | ✅ Implemented | 📌 Enhancements |
|------|----------------|-----------------|
| **Rate Limiting** | Auth endpoints limited via `express-rate-limit`. | • Extend rate limiting to **all write endpoints** (product, cart, order). |
| **Input Sanitization** | `sanitizeRequest` middleware strips `$` operators. | • Adopt a schema validator like **Zod** or **Joi** for all request bodies. |
| **JWT & Cookies** | HttpOnly, Secure, SameSite conditional. | • For production set **`SameSite=None`** and ensure **`Secure`** always true. |
| **RBAC** | Role checks in routes. | • Centralise permission logic using a **policy engine** (CASL). |
| **XSS / HTML Sanitisation** | Product description sanitised. | • Use **DOMPurify** on any HTML content before storing. |
| **IDOR** | Queries scoped to `req.user._id`. | • Add **resource‑level access logs** for audit trails. |
| **CSRF** | Not explicitly handled. | • Add CSRF token middleware (e.g., `csurf`) for state‑changing GET/POST forms. |
| **CSP & HSTS** | Helmet partially configured. | • Enforce **Content‑Security‑Policy** and **Strict‑Transport‑Security** headers. |
| **Dependency Audits** | No automated scans. | • Add **`npm audit`**, **Snyk**, or **GitHub Dependabot** CI job. |
| **Secrets Management** | Env vars in `.env`. | • Use **Render secret store** or **HashiCorp Vault** for production secrets. |

---

## 3️⃣ Missing Validations & Edge‑Case Coverage
### Missing / Weak Validations
- **Password Complexity** – only length checked.  Implement regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$`.
- **Phone Numbers** – free‑form string.  Use **E.164** format validation.
- **Address ZIP** – should be exactly 6 digits for India; enforce with regex `^\d{6}$`.
- **Image Count** – limited to 10, but no per‑product limit on **extra images** for variants.  Enforce ≤5 per variant.
- **Variant SKU Uniqueness** – ensure SKU is unique across the catalog (unique index).
- **Discounted Price** – already validated to be less than price, but also enforce **non‑negative** and **max discount ≤90 %**.
- **Cart Quantity** – currently prevents negative values but allows arbitrarily large numbers.  Impose a reasonable cap (e.g., 20).
- **Order Total** – ensure total matches sum of selected variant prices, not stale product price.

### Edge Cases to Test Explicitly
1. **Concurrent Stock Depletion** – Simulate two users buying the last unit; expect **one succeeds, the other 409 Conflict**.
2. **Price Change During Checkout** – Verify checkout uses **latest price**, not stale cached price.
3. **Coupon Expiry Mid‑Checkout** – Apply coupon, then wait until expiry; checkout must reject.
4. **Partial Failures in Bulk Import** – CSV import should rollback per‑row errors and report them without halting entire batch.
5. **Zero‑Quantity Cart Removal** – Removing an item should delete the cart entry, not leave a 0‑quantity record.
6. **Razorpay Webhook Replay** – Send same webhook twice; server must reject duplicates.
7. **Invalid ObjectId Formats** – Pass malformed MongoDB IDs; API should return **400 Bad Request**, not 500.
8. **Large Payloads** – Attempt to upload >5 MB image; server must reject with **413 Payload Too Large**.
9. **Rate‑Limit Exhaustion** – After exceeding limit, verify response includes `Retry-After` header.
10. **Cross‑Origin Requests** – Verify CORS only allows configured origins (including production domain).

---

## 4️⃣ Production‑Readiness Recommendations (2026 Industry Standards)
### Architecture & Deployment
- **Containerisation** – Dockerize both backend and frontend with multi‑stage builds.  Publish images to a registry and deploy via **Kubernetes** (or Render services with Dockerfile). 
- **CI/CD** – Configure **GitHub Actions**:
  1. Lint (`eslint` + `prettier`).
  2. Unit / integration test with coverage.
  3. Security scan (`npm audit`, Snyk).
  4. Build Docker images.
  5. Deploy to staging on every PR, production on `main`.
- **Observability** – Add **Winston** logger with JSON format, ship logs to **LogDNA** or **Elastic Stack**.  Expose **Prometheus metrics** (`express-prom-bundle`).
- **Health Checks** – Already have `/api/v1/health`; wrap with **Kubernetes liveness/readiness probes**.
- **Graceful Shutdown** – Listen for `SIGTERM` and close DB connections.
- **Feature Flags** – Use `node-config` or `unleash` for toggling experimental features.

### Code Quality & Type Safety
- Migrate the codebase to **TypeScript** (or at least add JSDoc types).  This improves IDE support and reduces runtime bugs.
- Enforce **ESLint** with the **Airbnb** style guide and `eslint-plugin-security`.
- Add **pre‑commit hooks** (`husky`) to run lint and tests.

### API Design & Documentation
- Generate an **OpenAPI 3.0 spec** automatically with `swagger-jsdoc` and expose a Swagger UI at `/api-docs`.
- Version the API (`/api/v1/…`) and plan for **v2** with backward‑compatible deprecations.
- Use **consistent error payloads** (`{ success: false, errorCode, message, details }`).

### Data & Performance
- Add **Redis** caching for frequent read‑only endpoints (product list, category list).
- Use **MongoDB Atlas Search** indexes for full‑text product search.
- Implement **cursor‑based pagination** for infinite scroll scenarios.
- Archive old orders to a **cold‑storage** collection (TTL index).

### Security Hardenings
- Enforce **CSP** (`script-src 'self'`) and **X‑Content‑Type‑Options**.
- Rotate **JWT secret** regularly; store it in a secret manager.
- Use **Helmet** with a strict configuration (`frameguard`, `referrerPolicy`).
- Add **Content‑Security‑Policy** and **Permissions‑Policy** headers.
- Implement **CSRF protection** for state‑changing routes.
- Conduct regular **penetration testing** (OWASP ZAP) and integrate results.

### Testing Infrastructure
- Use **Testcontainers** to spin up a fresh MongoDB instance for integration tests.
- Mock external services (Razorpay, Cloudinary) with **nock** or **msw**.
- Add **contract tests** using **Pact** to guarantee front‑end/back‑end contract stability.
- Store **Postman/Newman** runs as part of CI and publish results to a dashboard.

---

## 5️⃣ Action Items for the Repo (Checklist)
- [ ] Add **Zod/Joi** schemas for request validation across all routes.
- [ ] Convert `.js` files to **TypeScript** (`.ts`) and configure `ts-node` for dev.
- [ ] Implement **Dockerfile** for backend and add `docker-compose.yml` for local dev (MongoDB, Redis).
- [ ] Create **GitHub Actions workflow** (`ci.yml`) with lint, test, security, build, and deploy steps.
- [ ] Extend **rate limiting** to all mutating routes.
- [ ] Add **CSRF middleware**.
- [ ] Introduce **distributed tracing** (Jaeger) via `express-opentracing`.
- [ ] Write additional Jest tests covering all edge‑cases listed above.
- [ ] Publish **OpenAPI spec** and host Swagger UI.
- [ ] Update **README** with badges for CI status, coverage, Docker Hub, and security scan.
- [ ] Document **environment variables** in a `docs/ENV_VARS.md` file.
- [ ] Review and tighten **CORS** configuration – whitelist production domain only.
- [ ] Add **GitHub Dependabot** configuration for automated dependency updates.

---

*By following this roadmap the MensVibe codebase will evolve from a functional demo into a production‑grade, hire‑ready project that showcases modern best practices, test discipline, and security hygiene expected by top tech employers in 2026.*