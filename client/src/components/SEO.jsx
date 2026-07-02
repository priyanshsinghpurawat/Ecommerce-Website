import { Helmet } from 'react-helmet-async';

export const SEO = ({ title, description }) => {
  const siteName = 'MensVibe';
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const pageDesc = description || 'Premium streetwear and drip clothing for men. Shop the latest collections at MensVibe.';

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
    </Helmet>
  );
};