import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { Heart, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useWishlist } from '../hooks/useWishlist.js';

export const Wishlist = () => {
  const { wishlist: items, loading, toggleWishlist, fetchWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    try {
      const res = await toggleWishlist(productId);
      if (res.success) {
        toast.success('Removed from wishlist');
      }
    } catch (err) {
      toast.error('Could not remove item');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-lux-primary" />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-lux-dark/40">Loading your stash...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      <div className="border-b border-lux-100 pb-6">
        <div className="flex items-center gap-2 text-lux-primary mb-1">
          <Heart className="h-3 w-3 fill-current" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Saved items</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-lux-dark">My Wishlist</h1>
        <p className="text-sm text-lux-dark/50 mt-1">
          {items.length} {items.length === 1 ? 'product' : 'products'} waiting for you
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {items.map((prod) => (
            <div key={prod._id} className="group relative">
              <ProductCard product={prod} />
              <button
                onClick={() => handleRemove(prod._id)}
                className="absolute top-2 right-2 z-30 p-2 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                title="Remove from wishlist"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-lux-200 bg-lux-50/30">
          <div className="h-16 w-16 rounded-full bg-lux-100 flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-lux-dark/20" />
          </div>
          <h3 className="text-lg font-bold text-lux-dark">Your wishlist is empty</h3>
          <p className="text-sm text-lux-dark/50 mt-2 max-w-xs mx-auto">
            Save the items you love and they'll show up here.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 bg-lux-dark text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-lux-primary transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Go shopping
          </Link>
        </div>
      )}
    </div>
  );
};
