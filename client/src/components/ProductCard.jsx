import { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { toast } from 'react-hot-toast';
import { resolveImageUrl, getDiscountPercent } from '../utils/helpers.js';

export const ProductCard = ({ product, activeColor }) => {
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

  // Dynamic Color Image Swap
  let displayImage = product.image;
  let secondaryImage = product.images && product.images.length > 0 ? product.images[0] : null;

  if (activeColor && product.variantSummary?.colorImages) {
    const colorImg = product.variantSummary.colorImages[activeColor];
    if (colorImg) {
      displayImage = colorImg;
      // Find another color's image for hover flip
      const otherColors = Object.entries(product.variantSummary.colorImages).filter(([c]) => c !== activeColor);
      secondaryImage = otherColors.length > 0 ? otherColors[0][1] : (product.images?.[0] || null);
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

  return (
    <div className="group flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">
      <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative block aspect-[3/4] overflow-hidden bg-app-card rounded-2xl border border-transparent transition-all duration-300 group-hover:border-brand-primary/30 group-hover:shadow-2xl group-hover:shadow-brand-primary/10 group-hover:-translate-y-1"
    >
      <Link to={`/product/${product.slug || product._id}`} className="block h-full w-full">
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

      {/* Dynamic Badge System — Sticker Style */}
      <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-20">
        {product.badge === 'new-arrival' && (
          <span className="sticker-badge rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-black shadow-xl border border-black/5 -rotate-2">
            Fresh Drop
          </span>
        )}
        {product.badge === 'sale' && (
          <span className="sticker-badge rounded-lg bg-red-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-xl rotate-1">
            Red Hot
          </span>
        )}
        {discountPct > 20 && showOriginalPrice && (
          <span className="sticker-badge rounded-lg bg-brand-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-black shadow-xl -rotate-1">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Wishlist Heart — stays visible when wishlisted, hover-reveal otherwise */}
      <div className={`absolute right-3 top-3 flex flex-col gap-2 z-20 transition-all duration-300 ${
        isWishlisted ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0'
      }`}>
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`p-2.5 rounded-2xl backdrop-blur-md border transition-all active:scale-90 ${
            isWishlisted
              ? 'bg-red-500 text-white border-red-400/30 shadow-lg shadow-red-500/25'
              : 'bg-black/60 text-white border-white/10 hover:bg-red-500'
          } ${wishlistLoading ? 'opacity-50' : ''}`}
        >
          <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-current' : ''}`} />
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

      <Link to={`/product/${product.slug || product._id}`}>
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
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-md">
            SAVE ₹{(product.price - product.discountedPrice).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  </div>
);
};
