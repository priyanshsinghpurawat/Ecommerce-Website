import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import { getSubcategories } from '../services/subcategory.service.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { Search, SlidersHorizontal } from 'lucide-react';

export const Shop = () => {
  const { products, pagination, loading, error, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subcategories, setSubcategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const badge = searchParams.get('badge') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = Number(searchParams.get('page')) || 1;

  const activeSub = subcategories.find((s) => s._id === subcategory);
  const activeCat = categories.find((c) => c._id === category);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const loadSubs = async () => {
      try {
        const res = await getSubcategories(category || undefined);
        setSubcategories(res?.data || []);
      } catch {
        setSubcategories([]);
      }
    };
    loadSubs();
  }, [category]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    fetchProducts({ page, limit: 15, search, category, subcategory, sort, badge });
  }, [fetchProducts, page, search, category, subcategory, sort, badge]);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) updated.set(key, val);
      else updated.delete(key);
    });
    if (!('page' in newParams)) updated.set('page', '1');
    if (newParams.category !== undefined && !newParams.subcategory) {
      updated.delete('subcategory');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="border-b border-lux-100 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-primary">
          {badge === 'sale' ? 'Exclusive Offers' : badge === 'new-arrival' ? 'Latest Drop' : badge === 'street-drip' ? 'Street Collection' : activeSub?.name || activeCat?.name || 'Full catalog'}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-lux-dark mt-1">
          {badge === 'sale' ? 'Flash Sale' : badge === 'new-arrival' ? 'New Arrivals' : badge === 'street-drip' ? 'Street Drip' : activeSub ? activeSub.name : activeCat ? activeCat.name : 'Shop everything'}
        </h1>
        <p className="text-sm text-lux-dark/50 mt-1">
          {badge === 'street-drip' ? 'Funky street wear, oversized fits, and bold patterns.' : pagination.totalProducts != null
            ? `${pagination.totalProducts} products`
            : 'Clothing · Sportswear · Footwear · Accessories'}
        </p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          type="button"
          onClick={() => updateFilters({ category: '', subcategory: '', badge: '' })}
          className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            !category && !badge
              ? 'bg-lux-dark text-black'
              : 'border border-lux-200 bg-lux-50 text-lux-dark hover:border-lux-dark'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => updateFilters({ badge: 'sale', category: '', subcategory: '' })}
          className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            badge === 'sale'
              ? 'bg-red-600 text-white border-red-600'
              : 'border border-red-100 bg-red-50/30 text-red-600 hover:border-red-600'
          }`}
        >
          Sale
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            type="button"
            onClick={() => updateFilters({ category: cat._id, subcategory: '', badge: '' })}
            className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              category === cat._id
                ? 'bg-lux-dark text-black'
                : 'border border-lux-200 bg-lux-50 text-lux-dark hover:border-lux-dark'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategory pills when category selected */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => updateFilters({ subcategory: '' })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase ${
              !subcategory ? 'bg-lux-primary/15 text-lux-primary' : 'text-lux-dark/50 hover:text-lux-dark'
            }`}
          >
            All types
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub._id}
              type="button"
              onClick={() => updateFilters({ subcategory: sub._id, category })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase ${
                subcategory === sub._id
                  ? 'bg-lux-primary/15 text-lux-primary'
                  : 'text-lux-dark/50 hover:text-lux-dark'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3 rounded-2xl border border-lux-100 bg-lux-50/50 p-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Search tees, pants, sneakers..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-lux-200 bg-lux-50 px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-lux-primary"
          />
          <button type="submit" className="absolute left-3 top-3 text-lux-dark/35 hover:text-lux-primary transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-lux-dark/40 hidden sm:block" />
          <select
            value={sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-xl border border-lux-200 bg-lux-50 px-3 py-2.5 text-sm min-w-[140px]"
          >
            <option value="latest">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[...Array(10)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateFilters({ page: String(i + 1) })}
                  className={`h-9 min-w-[36px] rounded-lg text-xs font-bold ${
                    pagination.currentPage === i + 1
                      ? 'bg-lux-dark text-black'
                      : 'border border-lux-200 hover:border-lux-dark'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[3rem] border border-dashed border-lux-200 py-24 px-8 text-center bg-lux-50/30">
          <div className="mx-auto w-16 h-16 rounded-full bg-lux-100 flex items-center justify-center mb-6">
            <Search className="h-6 w-6 text-lux-dark/20" />
          </div>
          <h3 className="text-lg font-bold text-lux-dark">No matches found</h3>
          <p className="text-sm text-lux-dark/40 mt-2 max-w-xs mx-auto">
            We couldn't find any products matching your current filters. Try adjusting your search or clearing the filters.
          </p>
          <button
            type="button"
            onClick={() => updateFilters({ search: '', category: '', subcategory: '', badge: '', sort: 'latest' })}
            className="mt-8 inline-flex rounded-xl bg-lux-dark px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:scale-105 transition-transform"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};
