import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://mensvibe.in';
const DEFAULT_OG_IMAGE = 'https://mensvibe.in/og-image.jpg';

export const SEO = ({ title, description, image, canonical, noindex }) => {
  const siteName = 'MensVibe';
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const pageDesc = description || 'Premium streetwear and drip clothing for men. Shop the latest collections at MensVibe.';
  const ogImage = image || DEFAULT_OG_IMAGE;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteName,
          url: SITE_URL,
          logo: `${SITE_URL}/logo.svg`,
          sameAs: [
            'https://instagram.com/mensvibe',
            'https://facebook.com/mensvibe',
          ],
        })}
      </script>
    </Helmet>
  );
};

export const ProductJsonLd = ({ product }) => {
  if (!product) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.slice(0, 500),
    image: product.images?.[0] || product.image,
    sku: product.sku || product._id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'MensVibe',
    },
    offers: {
      '@type': 'Offer',
      price: product.discountedPrice || product.price,
      priceCurrency: 'INR',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  if (product.reviews && product.reviews.length > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating || 4.5,
      reviewCount: product.reviewCount || product.reviews.length,
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};