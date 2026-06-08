const PLACEHOLDER = '/assets/mens_shirt.png';

/** 
 * Resolves product image URLs. 
 * Supports Cloudinary, Unsplash, local assets, and external CDN URLs.
 * Optimizes Unsplash URLs for performance.
 */
export function resolveImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return PLACEHOLDER;

  let trimmed = url.trim();
  if (!trimmed) return PLACEHOLDER;

  // Handle common patterns like images.unsplash.com without protocol
  if (trimmed.includes('unsplash.com') && !trimmed.startsWith('http')) {
    trimmed = `https://${trimmed.replace(/^https?:\/\//, '')}`;
  }

  // Optimize Unsplash URLs
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('w', width.toString());
      return urlObj.toString();
    } catch (e) {
      // Fallback if URL is weird
      if (!trimmed.includes('?')) {
        return `${trimmed}?auto=format&fit=crop&q=80&w=${width}`;
      }
    }
  }

  // If it's a full URL or absolute/relative path that looks valid
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }

  // If it's just a filename that exists in assets
  if (trimmed.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
    return `/assets/${trimmed}`;
  }

  return PLACEHOLDER;
}

export function getDiscountPercent(price, discountedPrice) {
  if (discountedPrice === undefined || discountedPrice === null || discountedPrice >= price) return 0;
  return Math.round((1 - discountedPrice / price) * 100);
}
