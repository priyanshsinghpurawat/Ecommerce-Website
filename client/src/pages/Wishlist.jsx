import { useEffect } from 'react';
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
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-app-text/40">Loading your stash...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      <div className="border-b border-surface-100 pb-6">
        <div className="flex items-center gap-2 text-brand-primary mb-1">
          <Heart className="h-3 w-3 fill-current" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Saved items</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-app-text">My Wishlist</h1>
        <p className="text-sm text-app-text/50 mt-1">
          {items.length} {items.length === 1 ? 'product' : 'products'} waiting for you
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {items.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-surface-200 bg-surface-50/30">
          <div className="h-16 w-16 bg-surface-50 rounded-full flex items-center justify-center text-app-text/45 mb-4 shadow-soft">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-app-text">Your wishlist is empty</h3>
          <p className="text-sm text-app-text/50 mt-2 max-w-xs mx-auto">
            Save the items you love and they'll show up here.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 bg-brand-primary text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Go shopping
          </Link>
        </div>
      )}
    </div>
  );
};
