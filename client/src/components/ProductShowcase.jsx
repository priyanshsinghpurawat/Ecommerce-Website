import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { ProductCard } from './ProductCard.jsx';
import { ProductCardSkeleton } from './Skeleton.jsx';

export const ProductShowcase = ({
  title,
  subtitle,
  products = [],
  loading = false,
  viewAllLink = '/shop',
  viewAllLabel = 'View all'
}) => {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-lux-100 pb-4">
        <div>
          {subtitle && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-primary">
              {subtitle}
            </p>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-lux-dark tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          to={viewAllLink}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-lux-dark/60 hover:text-lux-primary shrink-0"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {[...Array(5)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-lux-dark/45 py-8 text-center">No products in this collection yet.</p>
      )}
    </section>
  );
};
