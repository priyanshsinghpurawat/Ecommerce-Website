import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
      <div className="flex items-end justify-between gap-4 border-b border-lux-100 pb-4 px-4 md:px-0">
        <div>
          {subtitle && (
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-lux-primary">
              {subtitle}
            </p>
          )}
          <h2 className="text-2xl font-black text-lux-dark tracking-tight uppercase italic">
            {title}
          </h2>
        </div>
        <Link
          to={viewAllLink}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-lux-dark/60 hover:text-lux-primary shrink-0 transition-colors"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-0 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4 md:overflow-visible">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="snap-start shrink-0 w-[70vw] sm:w-[45vw] md:w-auto md:shrink">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="flex overflow-x-auto gap-4 pb-4 px-4 md:px-0 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4 md:overflow-visible">
          {products.map((prod) => (
            <div key={prod._id} className="snap-start shrink-0 w-[70vw] sm:w-[45vw] md:w-auto md:shrink">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-lux-dark/45 py-8 text-center px-4">No products in this collection yet.</p>
      )}
    </section>
  );
};
