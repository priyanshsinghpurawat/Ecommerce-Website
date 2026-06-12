import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import { useShopFilters } from '../hooks/useShopFilters.js';
import { getSubcategories, getProducts } from '../services/api.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, X, ShoppingBag } from 'lucide-react';

/* ── Inline SVG category icons ── */
const ShirtIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
  </svg>
);

const SportShoeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 10.42 4.8-5.07"/>
    <path d="M19 18h3"/>
    <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14"/>
  </svg>
);

/* ── Category icon map ── */
const CATEGORY_ICONS = {
  clothing: ShirtIcon,
  footwear: SportShoeIcon,
};

/* ── Known colour → CSS value map for swatch rendering ── */
const COLOR_CSS = {
  black: '#111111', white: '#f5f5f5', blue: '#3b82f6', red: '#ef4444',
  green: '#22c55e', sand: '#c2b280', sage: '#8fae88', khaki: '#c3b091',
  navy: '#1e3a5f', grey: '#6b7280', brown: '#92400e', yellow: '#eab308',
  pink: '#ec4899', purple: '#a855f7', orange: '#f97316', olive: '#84863b',
  maroon: '#800000', cream: '#fffdd0', teal: '#14b8a6', 'neon black': '#1a1a1a',
};

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
      {open ? <div className="pb-4">{children}</div> : null}
    </div>
  );
};

export const Shop = () => {
  const { products, pagination, loading, error } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const { 
    filters, selectedColors, hasActiveFilters,
    priceMin, setPriceMin, priceMax, setPriceMax,
    updateFilters, toggleColor, applyPriceFilter, clearAllFilters, fetchProducts 
  } = useShopFilters();

  const [subcategories, setSubcategories] = useState([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);

  const activeSub = subcategories.find((s) => s._id === filters.subcategory);
  const activeCat = categories.find((c) => c._id === filters.category);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const loadSubs = async () => {
      try {
        const res = await getSubcategories(filters.category || undefined);
        setSubcategories(res?.data || []);
      } catch { setSubcategories([]); }
    };
    loadSubs();
  }, [filters.category]);

  useEffect(() => {
    getProducts({ limit: 200, fields: 'variants' })
      .then((res) => {
        const all = res?.data?.products || [];
        const colours = [...new Set(
          all.flatMap(p => (p.variants || []).map(v => v.color).filter(Boolean))
        )].sort();
        setAvailableColors(colours);
      })
      .catch(() => setAvailableColors([]));
  }, []);

  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

  useEffect(() => {
    fetchProducts({ 
      page: filters.page, limit: 15, search: filters.search, 
      category: filters.category, subcategory: filters.subcategory, 
      sort: filters.sort, badge: filters.badge, 
      minPrice: filters.minPrice, maxPrice: filters.maxPrice, color: filters.color 
    });
  }, [fetchProducts, filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  /* ── Filter Sidebar Content (shared between desktop & mobile) ── */
  const renderFilterContent = () => (
    <div className="space-y-2">
      {/* Category tree */}
      <CollapsibleSection title="Categories">
        <div className="space-y-1">
          <button type="button" onClick={() => updateFilters({ category: '', subcategory: '', badge: '' })}
            className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2.5 ${!filters.category && !filters.badge ? 'bg-app-text text-black' : 'hover:bg-surface-50 text-app-text/70'}`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            All Products
          </button>
          {categories.map((cat) => {
            const IconComp = CATEGORY_ICONS[cat.name.toLowerCase()];
            return (
              <button key={cat._id} type="button" onClick={() => updateFilters({ category: cat._id, subcategory: '', badge: '' })}
                className={`w-full text-left rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2.5 ${filters.category === cat._id ? 'bg-app-text text-black' : 'hover:bg-surface-50 text-app-text/70'}`}
              >
                {IconComp ? <IconComp className="h-4 w-4 shrink-0" /> : null}
                {cat.name}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Subcategories when a category is selected */}
      {subcategories.length > 0 ? (
        <CollapsibleSection title="Sub-Categories">
          <div className="space-y-1">
            <button type="button" onClick={() => updateFilters({ subcategory: '' })}
              className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${!filters.subcategory ? 'text-brand-primary bg-brand-primary/10' : 'text-app-text/60 hover:bg-surface-50'}`}
            >All</button>
            {subcategories.map((sub) => (
              <button key={sub._id} type="button" onClick={() => updateFilters({ subcategory: sub._id })}
                className={`w-full text-left rounded-xl px-4 py-2 text-xs font-bold transition-all ${filters.subcategory === sub._id ? 'text-brand-primary bg-brand-primary/10' : 'text-app-text/60 hover:bg-surface-50'}`}
              >{sub.name}</button>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

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

      {/* Colour Filter — dynamic from actual product variants */}
      {availableColors.length > 0 ? (
        <CollapsibleSection title="Colour" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((col) => {
              const css = COLOR_CSS[col.toLowerCase()] || '#888888';
              const isActive = selectedColors.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  title={col}
                  onClick={() => toggleColor(col)}
                  className={`flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all ${
                    isActive ? 'border-brand-primary scale-110' : 'border-transparent hover:border-app-text/20'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: css }}
                  />
                  <span className={`text-[8px] font-bold uppercase ${
                    isActive ? 'text-brand-primary' : 'text-muted'
                  }`}>{col}</span>
                </button>
              );
            })}
          </div>
        </CollapsibleSection>
      ) : null}



      {hasActiveFilters ? (
        <button type="button" onClick={clearAllFilters}
          className="w-full mt-2 rounded-xl border border-red-200 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
        >Clear All Filters</button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-8 pb-16">
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
            {hasActiveFilters ? <span className="h-2 w-2 rounded-full bg-brand-primary" /> : null}
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
        {mobileFilterOpen ? (
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
        ) : null}

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between border-b border-surface-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
                {filters.badge === 'sale' ? 'Exclusive Offers' : activeSub?.name || activeCat?.name || 'Full catalog'}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-app-text mt-1">
                {filters.badge === 'sale' ? 'Flash Sale' : activeSub ? activeSub.name : activeCat ? activeCat.name : 'Shop Everything'}
              </h1>
              <p className="text-sm text-app-text/50 mt-1">
                {pagination.totalProducts != null ? `${pagination.totalProducts} products` : 'Browse our collection'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="relative">
                <select 
                  value={filters.sort} 
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="appearance-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 pr-8 text-xs font-bold focus:outline-none focus:border-brand-primary text-app-text cursor-pointer"
                >
                  <option value="latest">Newest first</option>
                  <option value="priceAsc">Price: low → high</option>
                  <option value="priceDesc">Price: high → low</option>
                  <option value="bestSelling">Best Selling</option>
                  <option value="popularity">Most Popular</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-app-text/40 pointer-events-none" />
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
          </div>

          {/* Active filter pills */}
          {hasActiveFilters ? (
            <div className="flex flex-wrap gap-2">
              {activeCat ? (
                <span className="flex items-center gap-1 rounded-full bg-app-text/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-app-text">
                  {activeCat.name}
                  <button type="button" onClick={() => updateFilters({ category: '', subcategory: '' })}><X className="h-3 w-3" /></button>
                </span>
              ) : null}
              {activeSub ? (
                <span className="flex items-center gap-1 rounded-full bg-brand-primary/15 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-brand-primary">
                  {activeSub.name}
                  <button type="button" onClick={() => updateFilters({ subcategory: '' })}><X className="h-3 w-3" /></button>
                </span>
              ) : null}
              {(filters.minPrice || filters.maxPrice) ? (
                <span className="flex items-center gap-1 rounded-full bg-app-text/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-app-text">
                  ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
                  <button type="button" onClick={() => { setPriceMin(''); setPriceMax(''); updateFilters({ minPrice: '', maxPrice: '' }); }}><X className="h-3 w-3" /></button>
                </span>
              ) : null}

            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
              {pagination.totalPages > 1 ? (
                <div className="flex justify-center gap-2 pt-4">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button key={i} type="button" onClick={() => updateFilters({ page: String(i + 1) })}
                      className={`h-9 min-w-[36px] rounded-lg text-xs font-bold ${pagination.currentPage === i + 1 ? 'bg-app-text text-black' : 'border border-surface-200 hover:border-app-text'
                        }`}
                    >{i + 1}</button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[3rem] border border-dashed border-surface-200 py-24 px-8 text-center bg-surface-50/30">
              <div className="mx-auto w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mb-6 border border-surface-200">
                <Search className="h-7 w-7 text-app-text/20" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-app-text">No matches found</h3>
              <p className="text-xs text-app-text/40 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                We couldn't find anything with those filters. Try broadening your search or clearing a filter.
              </p>
              <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
                <button type="button" onClick={clearAllFilters}
                  className="inline-flex rounded-xl bg-app-text px-8 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:scale-105 transition-transform shadow-md"
                >Clear all filters</button>
                <Link to="/shop" className="inline-flex rounded-xl border border-surface-200 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-app-text/60 hover:border-brand-primary hover:text-brand-primary transition-colors">
                  Browse all
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
