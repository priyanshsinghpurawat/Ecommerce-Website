import React from 'react';
import { ProductCard } from './ProductCard.jsx';

export const ProductGrid = ({ products = [], columns = 3 }) => {
  if (!products.length) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[3]} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
