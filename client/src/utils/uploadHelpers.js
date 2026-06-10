/**
 * Frontend upload helpers — preview URLs, size guards, FormData assembly.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const validateImage = (file) => {
  if (!file) return 'No file';
  if (!ALLOWED.includes(file.type)) return `Unsupported type: ${file.type}`;
  if (file.size > MAX_BYTES) return `Too large (max ${MAX_BYTES / 1024 / 1024}MB)`;
  return null;
};

export const filterValidImages = (files) =>
  Array.from(files || []).filter((f) => !validateImage(f));

/** Generate a stable client id for a File so we can dedupe/reorder. */
export const makeImageItem = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
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
