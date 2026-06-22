import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { toast } from 'react-hot-toast';
import { resolveImageUrl, getDiscountPercent } from '../utils/helpers.js';

export const ProductCard = ({ product, activeColor }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const isWishlisted = isInWishlist(product._id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = product.discountedPrice !== null && product.discountedPrice !== undefined;
  const unitPrice = hasDiscount ? product.discountedPrice : product.price;
  const discountPct = getDiscountPercent(product.price, product.discountedPrice);
  const rating = product.rating > 0 ? product.rating.toFixed(1) : null;
  const reviews = product.reviewCount || 0;

  // Hide crossed-out original price for cheap products (under ₹1500)
  const showOriginalPrice = hasDiscount && unitPrice >= 1500;

  // Hover Flip Logic & Dynamic Color Image Swap
  let displayImage = product.image;
  let secondaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  if (activeColor) {
    const matchedVariant = product.variants?.find(v => v.color && v.color.toLowerCase() === activeColor.toLowerCase() && v.images?.length > 0);
    if (matchedVariant) {
      displayImage = matchedVariant.images[0];
      secondaryImage = matchedVariant.images.length > 1 ? matchedVariant.images[1] : (product.images?.[0] || null);
    }
  }

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to save items.');
      navigate('/login', { state: { from: location.pathname } });
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

  // Quick Size Selector Logic
  const [showSizes, setShowSizes] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Standard sizes for fallback/realistic feel
  const extractedSizes = product.variants?.length > 0
    ? [...new Set(product.variants.map(v => v.size).filter(Boolean))]
    : [];
  const availableSizes = extractedSizes.length > 0 ? extractedSizes : ['S', 'M', 'L', 'XL'];

  const handleQuickAdd = async (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Sign in to shop.');
      return;
    }
    setAddingToCart(true);
    const res = await addToCart(product._id, 1, { size });
    if (res.success) {
      toast.success(`Added ${product.title} (${size}) to bag!`);
      setShowSizes(false);
    } else {
      toast.error(res.error || 'Failed to add to bag.');
    }
    setAddingToCart(false);
  };

  return (
    <div className="group flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">
      <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSizes(false);
      }}
      className="relative block aspect-[3/4] overflow-hidden bg-app-card rounded-2xl border border-transparent transition-all group-hover:border-brand-primary/30 group-hover:shadow-2xl group-hover:shadow-brand-primary/5"
    >
      <Link to={`/product/${product._id}`} className="block h-full w-full">
        <img
          src={resolveImageUrl(displayImage, 600)}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/hero_casual.png';
          }}
          className={`h-full w-full object-cover object-top transition-all duration-700 ${isHovered ? (secondaryImage ? 'opacity-0 scale-108' : 'scale-108') : 'opacity-100 scale-100'
            }`}
        />

        {secondaryImage && (
          <img
            src={resolveImageUrl(secondaryImage, 600)}
            alt={`${product.title} alternate`}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-700 ${isHovered ? 'opacity-100 scale-108' : 'opacity-0 scale-100'
              }`}
          />
        )}
      </Link>

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
        {discountPct > 20 && showOriginalPrice && (
          <span className="rounded-lg bg-brand-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-black shadow-xl">
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

      {/* Quick Size Selector Overlay */}
      <div className={`absolute inset-x-0 bottom-0 z-30 bg-black/80 backdrop-blur-md p-4 transition-all duration-300 transform ${showSizes ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3 text-center italic">Select Your Size</p>
        <div className="flex flex-wrap justify-center gap-2">
          {availableSizes.map(size => (
            <button
              key={size}
              disabled={addingToCart}
              onClick={(e) => handleQuickAdd(e, size)}
              className="h-10 w-10 rounded-xl border border-white/20 text-[11px] font-black text-white hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all active:scale-90 disabled:opacity-50"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Subtle hover overlay / Quick Add Button */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 transition-all duration-300 ${isHovered && !showSizes ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowSizes(true);
          }}
          className="w-full rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Quick Add
        </button>
      </div>

      {rating && !isHovered && (
        <div className="absolute left-3 bottom-3 flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2 py-1 text-[9px] font-black text-white shadow-xl border border-white/5 transition-opacity">
          <Star className="h-2.5 w-2.5 fill-brand-primary text-brand-primary" />
          <span>{rating}</span>
        </div>
      )}
    </div>

    <div className="pt-4 space-y-1.5">
      {/* Urgency tag for low stock */}
      {product.stock > 0 && product.stock <= 3 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-tight text-red-500 animate-pulse">
            Only {product.stock} left
          </span>
        </div>
      )}

      <Link to={`/product/${product._id}`}>
        <h3 className="text-[12px] font-black uppercase tracking-tight text-app-text leading-tight line-clamp-1 hover:text-brand-primary transition-colors">
          {product.title}
        </h3>
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black tracking-tighter text-app-text">₹{unitPrice.toLocaleString('en-IN')}</span>
          {showOriginalPrice && (
            <span className="text-[10px] text-muted line-through font-bold tracking-tighter">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {showOriginalPrice && (
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            SAVE ₹{(product.price - product.discountedPrice).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  </div>
);
};
