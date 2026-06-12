/**
 * unwrapData — Pull payload out of standard API envelope.
 * getErrorMessage — Human-friendly error parsing.
 */
export function unwrapData(body) {
  if (body == null) return null;
  if (typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

export function getErrorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK') {
      return "Can't reach the shop API. Start the server with `npm run dev` in the /server folder.";
    }
    return error?.message || fallback;
  }
  const msg = error.response.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || fallback;
}

/** 
 * resolveImageUrl — Supports Cloudinary, Unsplash, and local assets.
 */
const PLACEHOLDER = '/assets/hero_casual.png';
export function resolveImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return PLACEHOLDER;
  let trimmed = url.trim();
  if (!trimmed) return PLACEHOLDER;

  if (trimmed.includes('unsplash.com') && !trimmed.startsWith('http')) {
    trimmed = `https://${trimmed.replace(/^https?:\/\//, '')}`;
  }

  if (trimmed.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(trimmed.includes('?') ? trimmed : `${trimmed}?w=${width}`);
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('w', width.toString());
      return urlObj.toString();
    } catch (e) {
      return trimmed;
    }
  }

  if (trimmed.includes('res.cloudinary.com')) {
    if (trimmed.includes('/upload/') && !trimmed.includes('/upload/q_')) {
      return trimmed.replace('/upload/', `/upload/q_auto,f_auto,w_${width},c_limit/`);
    }
    return trimmed;
  }

  if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return trimmed;
  }

  if (trimmed.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
    return `/assets/${trimmed}`;
  }

  return PLACEHOLDER;
}

export function getDiscountPercent(price, discountedPrice) {
  if (!price || price <= 0 || discountedPrice === undefined || discountedPrice === null || discountedPrice >= price) return 0;
  return Math.round((1 - discountedPrice / price) * 100);
}

/** phone helpers */
export function normalizeIndianPhone(input) {
  let digits = String(input ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function validateIndianPhone(input) {
  const digits = normalizeIndianPhone(input);
  if (!digits) return { valid: false, message: 'Phone number is required.' };
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { valid: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  return { valid: true, digits };
}

/** upload helpers */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const validateImage = (file) => {
  if (!file) return 'No file';
  if (!ALLOWED.includes(file.type)) return `Unsupported type: ${file.type}`;
  if (file.size > MAX_BYTES) return `Too large (max 5MB)`;
  return null;
};

export const filterValidImages = (files) => Array.from(files || []).filter((f) => !validateImage(f));

export const makeImageItem = (file) => ({
  id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  kind: 'file'
});

export const makeRemoteItem = (url) => ({
  id: `remote-${url}`,
  url,
  previewUrl: url,
  kind: 'remote'
});

export const revokeItem = (item) => {
  if (item?.kind === 'file' && item.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(item.previewUrl);
  }
};
