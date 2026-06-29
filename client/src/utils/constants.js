// Shared color and size constants used across VariantEditor, VariantQuickEdit,
// VariantDataTable, and VariantGeneratorModal.

export const COLOR_MAP = {
  Black: '#111111',
  White: '#f5f5f5',
  Blue: '#3b82f6',
  Red: '#ef4444',
  Green: '#22c55e',
  Sand: '#c2b280',
  Sage: '#8fae88',
  Khaki: '#c3b091',
  'Neon Black': '#1a1a1a',
  Navy: '#1e3a5f',
  Grey: '#6b7280',
  Brown: '#92400e',
  Yellow: '#eab308',
  Pink: '#ec4899',
  Purple: '#a855f7',
  Orange: '#f97316',
  Olive: '#84863b',
  Maroon: '#800000',
  Cream: '#fffdd0',
  Teal: '#14b8a6',
};

export const COLOR_OPTIONS = Object.keys(COLOR_MAP);

export const SIZE_GROUPS = [
  { label: 'Apparel', sizes: ['MT', 'LT', 'XLT', '2XLT', '3XLT', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'], types: ['clothing', 'apparel', 'sportswear'] },
  { label: 'Bottoms (Waist)', sizes: ['30x34', '32x34', '32x36', '34x34', '34x36', '36x36', '36x38', '38x36', '38x38', '28', '30', '32', '34', '36', '38', '40', '42', '44'], types: ['clothing', 'apparel', 'bottoms'] },
  { label: 'Footwear (UK)', sizes: ['UK 10.5', 'UK 11', 'UK 12', 'UK 13', 'UK 14', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'], types: ['footwear', 'shoes', 'sneakers', 'boots'] },
];

export const getSizeGroups = (categoryName = '') => {
  const cat = categoryName.toLowerCase();
  if (!cat) return SIZE_GROUPS;
  const filtered = SIZE_GROUPS.filter(g => g.types.some(t => cat.includes(t)));
  return filtered.length > 0 ? filtered : SIZE_GROUPS;
};

export const ALL_SIZES = SIZE_GROUPS.flatMap(g => g.sizes);
