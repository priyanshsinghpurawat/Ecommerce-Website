import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
      <h1 className="text-4xl font-extrabold text-lux-dark tracking-wide uppercase">404</h1>
      <p className="text-lux-dark/50 text-xs font-bold uppercase tracking-wider">Page Not Found</p>
      <p className="text-xs text-lux-dark/40 font-sans max-w-sm">The URL or page you are looking for might have been moved or does not exist.</p>
      <Link
        to="/"
        className="text-[10px] font-bold uppercase tracking-wider bg-lux-dark text-black px-6 py-2.5 rounded-xl transition-all shadow-sm"
      >
        Go Home
      </Link>
    </div>
  );
};
