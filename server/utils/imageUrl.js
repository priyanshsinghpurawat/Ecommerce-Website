const PLACEHOLDER = '/assets/mens_shirt.png';

/** Cloudinary / CDN URL from multer-cloudinary upload */
export function imageUrlFromUploadedFile(req, file) {
  if (!file?.path || typeof file.path !== 'string') return undefined;
  if (!file.path.startsWith('http')) {
    throw new Error('Upload must return a Cloudinary HTTPS URL.');
  }
  return file.path;
}

export function normalizeImageUrl(image) {
  if (!image || typeof image !== 'string') return PLACEHOLDER;
  const trimmed = image.trim();
  if (!trimmed) return PLACEHOLDER;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('.')
  ) {
    return trimmed;
  }
  
  // If it's just a filename that exists in assets
  if (trimmed.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
    return `/assets/${trimmed}`;
  }

  return PLACEHOLDER;
}

export function mapProductForResponse(product, req) {
  if (!product) return product;
  const obj = product.toObject ? product.toObject() : { ...product };
  obj.image = normalizeImageUrl(obj.image);
  
  if (obj.images && Array.isArray(obj.images)) {
    obj.images = obj.images.map(img => normalizeImageUrl(img));
  }

  if (obj.colors && Array.isArray(obj.colors)) {
    obj.colors = obj.colors.map(c => ({
      ...c,
      images: Array.isArray(c.images) ? c.images.map(img => normalizeImageUrl(img)) : []
    }));
  }

  if (obj.variants && Array.isArray(obj.variants)) {
    obj.variants = obj.variants.map(v => ({
      ...v,
      images: Array.isArray(v.images) ? v.images.map(img => normalizeImageUrl(img)) : []
    }));
  }

  return obj;
}

/** @deprecated use mapProductForResponse */
export const mapProductImage = mapProductForResponse;
