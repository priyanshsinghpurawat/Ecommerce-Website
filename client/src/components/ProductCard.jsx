import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { toast } from 'react-hot-toast';
import { resolveImageUrl, getDiscountPercent } from '../utils/imageUrl.js';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product._id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = product.discountedPrice !== null && product.discountedPrice !== undefined;
  const unitPrice = hasDiscount ? product.discountedPrice : product.price;
  const discountPct = getDiscountPercent(product.price, product.discountedPrice);
  const rating = product.rating > 0 ? product.rating.toFixed(1) : null;
  const reviews = product.reviewCount || 0;

  // Hover Flip Logic: Find a secondary image if it exists
  const secondaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to save items.');
      return;
    }
    setWishlistLoading(true);
    const res = await toggleWishlist(product._id);
    if (res.success) {
      toast.success(res.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist.');
    } else {
      toast.error(res.error || 'Wishlist update failed.');
    }
    setWishlistLoading(false);
  };

  return (
    <div className="group flex flex-col bg-lux-bg overflow-hidden animate-in fade-in duration-500">
      <Link
        to={`/product/${product._id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative block aspect-[3/4] overflow-hidden bg-lux-card rounded-2xl border border-border-base transition-all group-hover:border-lux-primary/30 group-hover:shadow-2xl group-hover:shadow-lux-primary/5"
      >
        <img
          src={resolveImageUrl(product.image, 600)}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/mens_shirt.png';
          }}
          className={`h-full w-full object-cover object-top transition-all duration-700 ${isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            }`}
        />

        {secondaryImage && (
          <img
            src={resolveImageUrl(secondaryImage, 600)}
            alt={`${product.title} alternate`}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
          />
        )}

        {/* Dynamic Badge System (Savana Vibes) */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-20">
          {product.badge === 'new-arrival' && (
            <span className="rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-black shadow-xl border border-black/5">
              Fresh Drop
            </span>
          )}
          {product.badge === 'sale' && (
            <span className="rounded-lg bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-xl animate-pulse">
              Red Hot
            </span>
          )}
          {discountPct > 20 && (
            <span className="rounded-lg bg-lux-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-black shadow-xl">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Action HUD */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
          <button
            type="button"
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className={`p-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/10 transition-all hover:bg-red-500 active:scale-90 ${wishlistLoading ? 'opacity-50' : ''}`}
          >
            <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Floating Quick Add (Savana Style) */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            if (!isAuthenticated) return toast.error('Sign in first');
            const res = await addToCart(product._id, 1);
            if (res.success) toast.success('Added to bag');
          }}
          className="absolute bottom-3 right-3 left-3 flex items-center justify-center gap-2 rounded-2xl bg-white text-black py-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-lux-primary"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Quick Add
        </button>

        {rating && (
          <div className="absolute left-3 bottom-3 flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2 py-1 text-[9px] font-black text-white shadow-xl border border-white/5 group-hover:opacity-0 transition-opacity">
            <Star className="h-2.5 w-2.5 fill-lux-primary text-lux-primary" />
            <span>{rating}</span>
          </div>
        )}
      </Link>

      <div className="pt-4 space-y-1.5">
        {/* Merchant Branding */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-lux-primary bg-lux-dark px-2 py-0.5 rounded-md">
            {product.seller?.brandName || 'Originals'}
          </span>
          <span className="h-px flex-1 bg-lux-100/50" />
        </div>

        <Link to={`/product/${product._id}`}>
          <h3 className="text-[12px] font-black uppercase tracking-tight text-lux-dark leading-tight line-clamp-1 hover:text-lux-primary transition-colors italic">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black italic tracking-tighter text-lux-dark">₹{unitPrice.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className="text-[10px] text-muted line-through font-bold tracking-tighter">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              SAVE ₹{(product.price - product.discountedPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
