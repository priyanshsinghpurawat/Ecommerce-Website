# MensVibe E-commerce - OWASP Security Checklist & Audit

This document outlines the security measures implemented in the MensVibe application according to the OWASP Top 10 vulnerabilities.

## 1. Broken Access Control
✅ **Implemented:**
- **Role-Based Access Control (RBAC):** Middleware (`authorizeRoles`) enforces strict boundaries between Admin, Vendor, and Customer routes.
- **Data Segregation:** Sellers can only view and update their own products and order items. Users can only fetch their own orders and profiles.
- **Direct Object Reference (IDOR) Prevention:** Authorization checks ensure users cannot access other users' data by manipulating IDs in the URL.

## 2. Cryptographic Failures
✅ **Implemented:**
- **Password Hashing:** Passwords are hashed using `bcryptjs` with a secure salt round before storage.
- **Sensitive Data Exposure:** Payment credentials (Razorpay API keys) are strictly kept in server environment variables and never sent to the client.
- **HTTPS Enforcement:** Deployment environments should be configured to enforce HTTPS only.

## 3. Injection (SQL, NoSQL, XSS)
✅ **Implemented:**
- **NoSQL Injection Prevention:** Mongoose ODM inherently escapes queries. Additional middleware or schema validation rejects arbitrary object payloads (`$ne`, etc.).
- **Cross-Site Scripting (XSS) Prevention:** Handled partially via React's default DOM escaping. The server utilizes Helmet to set secure Content Security Policies (CSP).
- **Data Validation:** Zod schemas are used across the API to strictly validate types, lengths, and formats.

## 4. Insecure Design
✅ **Implemented:**
- **Rate Limiting:** `express-rate-limit` prevents brute-force login attacks and DDoS on API endpoints.
- **Business Logic Checks:** Stock limits are rigidly verified during the order transaction using database sessions (ACID compliance) to prevent negative stock.

## 5. Security Misconfiguration
✅ **Implemented:**
- **Helmet Middleware:** Sets HTTP headers for security (e.g., hiding `X-Powered-By`, enabling HSTS, preventing MIME-sniffing).
- **CORS Configuration:** Strictly limited to the frontend domain via the `CORS_ORIGIN` environment variable.

## 6. Vulnerable and Outdated Components
✅ **Implemented:**
- **Dependency Audit:** Regular dependency checks and version pinning. Run `npm audit` across directories to verify zero high- or critical-severity vulnerabilities.

## 7. Identification and Authentication Failures
✅ **Implemented:**
- **Secure JWT Tokens:** JWTs are issued upon login and used for subsequent requests.
- **Cookie Security:** Using `httpOnly` cookies (if configured) or passing the token securely through Authorization headers.

## 8. Software and Data Integrity Failures
✅ **Implemented:**
- **CI/CD Pipeline:** GitHub actions perform linting and tests before any merge to `main`.
- **Image Upload Security:** Multer and Cloudinary are configured to only accept specific MIME types (images), preventing the execution of malicious scripts disguised as images.

## 9. Security Logging and Monitoring Failures
✅ **Implemented:**
- **Winston & Morgan Logging:** Winston handles logging with automated transport to files (`logs/error.log` and `logs/combined.log`) in production.
- **Production Audit Logger:** Configured global request logging middleware for all state-changing (non-GET) actions in production.

## 10. Server-Side Request Forgery (SSRF)
✅ **Implemented:**
- Application does not accept URLs from users to fetch data on the server side (except for defined webhooks like Razorpay, which are verified via cryptographic signatures).

---
### Next Steps for Security Hardening:
1. Conduct an external penetration test or automated DAST scan before public launch.
2. Ensure production environment variables strictly enforce `NODE_ENV=production`.
3. Periodically rotate JWT Secrets and Payment API keys.
