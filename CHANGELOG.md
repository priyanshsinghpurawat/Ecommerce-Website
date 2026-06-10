# Changelog

All notable changes to the MensVibe project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [V3.0.0-dev] - 2026-06-10

### Added
- **Maintenance & Cleanup Guide**: New section in `DEVELOPER_GUIDE.md` for managing assets and build artifacts.
- **Size Selection Metadata**: Backend `Cart` model and `addToCart` controller now support storing specific product sizes.
- **Product Variants**: Added support for Size, Color, and SKU in the product seeder.
- **Professional Seeder Data**: Replaced placeholder fashion data with high-quality studio photography URLs.

### Changed
- **Semantic Naming Refactor**: Global rename of confusing prefixes (`lux-`) to descriptive ones (`brand-`, `app-`, `surface-`, `accent-`).
- **Pagination Standardization**: Unified `totalItems` and `totalProducts` logic in the frontend context for UI consistency.
- **Order Total Logic**: Updated checkout build logic to include 18% GST (Tax) calculation.

### Fixed
- **Security (Regex Injection)**: Hardened the `getAllProducts` controller by escaping user-supplied filter inputs to prevent ReDoS and injection attacks.
- **Cart Logic Bug**: Fixed `ProductCard.jsx` where the selected size was not being passed to the `addToCart` function.
- **Data Integrity**: Cleaned up null/empty values in product variants within the seeder script.
- **Linting**: Fixed undefined state setter in `SellerLayout.jsx`.

---

## [V2.0.0] - 2026-05-20
- Initial implementation of Multi-Vendor Support (Seller Dashboard).
- Page-based code splitting for performance.
- Debounced search autosuggestion.

## [V1.0.0] - 2026-04-15
- Core MERN Stack deployment.
- Basic Authentication and Shopping Cart.
