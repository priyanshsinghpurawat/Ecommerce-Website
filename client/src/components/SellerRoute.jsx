import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

export const SellerRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-lux-50">
        <Loader2 className="h-10 w-10 animate-spin text-lux-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user.role !== 'seller' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
