import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { SEO } from '../components/SEO.jsx';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[60vh]">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <div className="relative mb-8">
        <h1 className="text-[120px] sm:text-[160px] font-black text-app-text/5 leading-none select-none tracking-tighter">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl sm:text-7xl">🔍</span>
        </div>
      </div>

      <h2 className="text-xl font-black uppercase tracking-wider text-app-text mb-2">
        Page Not Found
      </h2>
      <p className="text-xs text-app-text/45 font-sans max-w-sm leading-relaxed mb-8">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-2xl bg-brand-primary px-8 py-3 text-xs font-black uppercase tracking-widest text-black hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Home
        </Link>
        <Link
          to="/shop"
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-3 text-xs font-black uppercase tracking-widest text-app-text hover:bg-white/10 transition-all active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
