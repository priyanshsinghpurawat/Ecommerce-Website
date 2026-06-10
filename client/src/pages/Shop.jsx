import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import { getSubcategories } from '../services/subcategory.service.js';
import { getProducts } from '../services/product.service.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, X, ShoppingBag, Star } from 'lucide-react';

/* ── Color palette for filter swatches ── */
const COLOR_SWATCHES = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Sand', hex: '#C2B280' },
  { name: 'Sage', hex: '#87AE73' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Neon Green', hex: '#39FF14' },

  
];

/* ── Collapsible Section Component ── */
const CollapsibleSection = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-xs font-black uppercase tracking-widest text-app-text"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-app-text/40" /> : <ChevronDown className="h-4 w-4 text-app-text/40" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
};

/* ── Category Image Tile ── */
const CategoryTile = ({ label, image, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 group transition-all ${isActive ? 'scale-105' : ''}`}
  >
    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-brand-primary shadow-lg shadow-brand-primary/20' : 'border-transparent hover:border-app-text/20'
      }`}>
      <img
        src={image}
        alt={label}
        loading="lazy"
        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/mens_shirt.png'; }}
        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
      />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-wider text-center leading-tight ${isActive ? 'text-brand-primary' : 'text-app-text/60'
      }`}>
      {label}
    </span>
  </button>
);
const getCategoryFallbackImage = (catName) => {
  const name = catName.toLowerCase();
  if (name.includes('clothing')) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200';
  if (name.includes('footwear')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200';
  if (name.includes('sportswear')) return 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200';
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200';
};

const getSubcategoryFallbackImage = (subName) => {
  const name = subName.toLowerCase();
  if (name.includes('boot')) return 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=200';
  if (name.includes('sport')) return 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=80&w=200';
  if (name.includes('sneaker')) return 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=200';
  if (name.includes('shirt')) return 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073624/1731995063_3156808_i9pamp.avif';
  if (name.includes('pant') || name.includes('jean') || name.includes('cargo')) return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=200';
  if (name.includes('linen')) return 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984919/mensvibe/products/1739601040_8064076.avif';
  if (name.includes('streetwear')) return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200';
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200';
};

export const Shop = () => {
  const { products, pagination, loading, error, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subcategories, setSubcategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Read all filter params from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const badge = searchParams.get('badge') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = Number(searchParams.get('page')) || 1;
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const color = searchParams.get('color') || '';

  const [priceMin, setPriceMin] = useState(minPrice || '');
  const [priceMax, setPriceMax] = useState(maxPrice || '');

  const selectedColors = useMemo(() => color ? color.split(',').filter(Boolean) : [], [color]);

  const activeSub = subcategories.find((s) => s._id === subcategory);
  const activeCat = categories.find((c) => c._id === category);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const loadSubs = async () => {
      try {
        const res = await getSubcategories(category || undefined);
        setSubcategories(res?.data || []);
      } catch { setSubcategories([]); }
    };
    loadSubs();
  }, [category]);

  // Load ALL subcategories for the image grid (ungrouped)
  const [allSubcategories, setAllSubcategories] = useState([]);
  useEffect(() => {
    getSubcategories()
      .then((res) => setAllSubcategories(res?.data || []))
      .catch(() => setAllSubcategories([]));
  }, []);



  useEffect(() => { setSearchInput(search); }, [search]);

  useEffect(() => {
    fetchProducts({ page, limit: 15, search, category, subcategory, sort, badge, minPrice, maxPrice, color });
  }, [fetchProducts, page, search, category, subcategory, sort, badge, minPrice, maxPrice, color]);

  const updateFilters = useCallback((newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) updated.set(key, val);
      else updated.delete(key);
    });
    if (!('page' in newParams)) updated.set('page', '1');
    if (newParams.category !== undefined && !newParams.subcategory) updated.delete('subcategory');
    setSearchParams(updated);
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const toggleColor = (colorName) => {
    const current = new Set(selectedColors);
    if (current.has(colorName)) current.delete(colorName);
    else current.add(colorName);
    updateFilters({ color: [...current].join(',') || '' });
  };

  const applyPriceFilter = () => {
    updateFilters({ minPrice: priceMin || '', maxPrice: priceMax || '' });
  };

  const clearAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    updateFilters({ search: '', category: '', subcategory: '', badge: '', sort: 'latest', minPrice: '', maxPrice: '', color: '' });
  };

  const hasActiveFilters = category || subcategory || badge || minPrice || maxPrice || color || search;

  // Group subcategories by parent category
  const categoriesWithSubs = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      subs: allSubcategories.filter(s => {
        const pid = typeof s.category === 'object' ? s.category?._id : s.category;
        return pid === cat._id;
      })
    }));
  }, [categories, allSubcategories]);

  /* ── Filter Sidebar Content (shared between desktop & mobile) ── */
  const renderFilterContent = () => (
    <div className="space-y-2">
      {/* Category tree */}
      <CollapsibleSection title="Categories">
        <div className="space-y-1">
          <button type="button" onClick={() => updateFilters({ category: '', subcategory: '', badge: '' })}
            className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${!category && !badge ? 'bg-app-text text-black' : 'hover:bg-surface-50 text-app-text/70'}`}
          >All Products</button>
          {categories.map((cat) => (
            <button key={cat._id} type="button" onClick={() => updateFilters({ category: cat._id, subcategory: '', badge: '' })}
              className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${category === cat._id ? 'bg-app-text text-black' : 'hover:bg-surface-50 text-app-text/70'}`}
            >{cat.name}</button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Subcategories when a category is selected */}
      {subcategories.length > 0 && (
        <CollapsibleSection title="Sub-Categories">
          <div className="space-y-1">
            <button type="button" onClick={() => updateFilters({ subcategory: '' })}
              className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${!subcategory ? 'text-brand-primary bg-brand-primary/10' : 'text-app-text/60 hover:bg-surface-50'}`}
            >All</button>
            {subcategories.map((sub) => (
              <button key={sub._id} type="button" onClick={() => updateFilters({ subcategory: sub._id })}
                className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${subcategory === sub._id ? 'text-brand-primary bg-brand-primary/10' : 'text-app-text/60 hover:bg-surface-50'}`}
              >{sub.name}</button>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Price Range */}
      <CollapsibleSection title="Price Range">
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
          />
          <span className="text-app-text/30 text-xs">–</span>
          <input type="number" placeholder="Max" value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>
        <button type="button" onClick={applyPriceFilter}
          className="mt-2 w-full rounded-xl bg-app-text py-2 text-[10px] font-black uppercase tracking-widest text-black hover:opacity-90 transition-opacity"
        >Apply Price</button>
      </CollapsibleSection>



      {/* Sort */}
      <CollapsibleSection title="Sort By">
        <select value={sort} onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full appearance-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-primary text-app-text cursor-pointer"
        >
          <option value="latest">Newest first</option>
          <option value="priceAsc">Price: low → high</option>
          <option value="priceDesc">Price: high → low</option>
          <option value="bestSelling">Best Selling</option>
          <option value="popularity">Most Popular</option>
        </select>
      </CollapsibleSection>

      {hasActiveFilters && (
        <button type="button" onClick={clearAllFilters}
          className="w-full mt-2 rounded-xl border border-red-200 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
        >Clear All Filters</button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-16">

      {/* ── TOP HORIZONTAL CATEGORY SCROLLER (Powerlook Style) ── */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => updateFilters({ category: '', subcategory: '', badge: '' })}
          className={`flex flex-col items-center gap-2 shrink-0 transition-all ${!category && !badge ? 'scale-105' : 'opacity-60'}`}
        >
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition-all ${!category && !badge ? 'border-brand-primary bg-brand-primary/10 shadow-lg' : 'border-surface-100 bg-surface-50'
            }`}>
            <ShoppingBag className={`h-6 w-6 ${!category && !badge ? 'text-brand-primary' : 'text-app-text/40'}`} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">All</span>
        </button>

        {categories.map((cat) => {
          const isActive = category === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => updateFilters({ category: cat._id, subcategory: '', badge: '' })}
              className={`flex flex-col items-center gap-2 shrink-0 transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all ${isActive ? 'border-brand-primary shadow-lg' : 'border-surface-100'
                }`}>
                <img
                  src={getCategoryFallbackImage(cat.name)}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{cat.name}</span>
            </button>
          );
        })}

        {/* Static Bestseller Pill */}
        <button
          onClick={() => updateFilters({ badge: 'sale', category: '', subcategory: '' })}
          className={`flex flex-col items-center gap-2 shrink-0 transition-all ${badge === 'sale' ? 'scale-105' : 'opacity-60'}`}
        >
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition-all ${badge === 'sale' ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/10' : 'border-surface-100 bg-surface-50'
            }`}>
            <Star className={`h-6 w-6 ${badge === 'sale' ? 'text-red-500 fill-current' : 'text-app-text/40'}`} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Sale</span>
        </button>
      </div>

      <div className="w-full h-px bg-surface-100" />

      {/* ── CATEGORY IMAGE GRID (Souled Store style) ── */}
      {categoriesWithSubs.map((cat) => (
        cat.subs.length > 0 && (
          <CollapsibleSection key={cat._id} title={cat.name} defaultOpen={!category || category === cat._id}>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {cat.subs.map((sub) => (
                <CategoryTile
                  key={sub._id}
                  label={sub.name}
                  image={sub.image ? resolveImageUrl(sub.image, 200) : getSubcategoryFallbackImage(sub.name)}
                  isActive={subcategory === sub._id}
                  onClick={() => updateFilters({ category: cat._id, subcategory: sub._id, badge: '' })}
                />
              ))}
            </div>
          </CollapsibleSection>
        )
      ))}

      {/* Transparent gradient divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />

      {/* ── MAIN LAYOUT: Sidebar + Grid ── */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-28">
          {renderFilterContent()}
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center gap-3 w-full">
          <button type="button" onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-app-text"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-brand-primary" />}
          </button>
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input type="text" placeholder="Search..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-brand-primary"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-app-text/35" />
          </form>
        </div>

        {/* Mobile Filter Drawer (Bottom Sheet) */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-app-bg rounded-t-3xl border-t border-surface-100 p-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-app-text">Filters</h3>
                <button type="button" onClick={() => setMobileFilterOpen(false)} className="p-2 text-app-text/60">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderFilterContent()}
              <button type="button" onClick={() => setMobileFilterOpen(false)}
                className="w-full mt-4 rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-black"
              >Show Results</button>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between border-b border-surface-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
                {badge === 'sale' ? 'Exclusive Offers' : activeSub?.name || activeCat?.name || 'Full catalog'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-app-text mt-1">
                {badge === 'sale' ? 'Flash Sale' : activeSub ? activeSub.name : activeCat ? activeCat.name : 'Shop Everything'}
              </h1>
              <p className="text-sm text-app-text/50 mt-1">
                {pagination.totalProducts != null ? `${pagination.totalProducts} products` : 'Browse our collection'}
              </p>
            </div>
            {/* Desktop search */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:block relative w-64">
              <input type="text" placeholder="Search..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-brand-primary"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-app-text/35" />
            </form>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {activeCat && (
                <span className="flex items-center gap-1 rounded-full bg-app-text/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-app-text">
                  {activeCat.name}
                  <button type="button" onClick={() => updateFilters({ category: '', subcategory: '' })}><X className="h-3 w-3" /></button>
                </span>
              )}
              {activeSub && (
                <span className="flex items-center gap-1 rounded-full bg-brand-primary/15 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-brand-primary">
                  {activeSub.name}
                  <button type="button" onClick={() => updateFilters({ subcategory: '' })}><X className="h-3 w-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="flex items-center gap-1 rounded-full bg-app-text/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-app-text">
                  ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
                  <button type="button" onClick={() => { setPriceMin(''); setPriceMax(''); updateFilters({ minPrice: '', maxPrice: '' }); }}><X className="h-3 w-3" /></button>
                </span>
              )}

            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((prod) => <ProductCard key={prod._id} product={prod} activeColor={selectedColors[0]} />)}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button key={i} type="button" onClick={() => updateFilters({ page: String(i + 1) })}
                      className={`h-9 min-w-[36px] rounded-lg text-xs font-bold ${pagination.currentPage === i + 1 ? 'bg-app-text text-black' : 'border border-surface-200 hover:border-app-text'
                        }`}
                    >{i + 1}</button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-[3rem] border border-dashed border-surface-200 py-24 px-8 text-center bg-surface-50/30">
              <div className="mx-auto w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-6">
                <Search className="h-6 w-6 text-app-text/20" />
              </div>
              <h3 className="text-lg font-bold text-app-text">No matches found</h3>
              <p className="text-sm text-app-text/40 mt-2 max-w-xs mx-auto">
                Try adjusting your filters or clearing them.
              </p>
              <button type="button" onClick={clearAllFilters}
                className="mt-8 inline-flex rounded-xl bg-app-text px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:scale-105 transition-transform"
              >Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
