import React, { useState, useMemo } from 'react';

/**
 * StockHeatmap — Real data heatmap showing inventory distribution
 * across actual product categories and time periods.
 *
 * Props:
 *   products — array of product objects from the API (with stock, category, createdAt, updatedAt)
 */

const STOCK_THRESHOLDS = [
  { max: 10, level: 1, label: 'Critical', color: 'bg-red-500/30 border-red-500/10', dot: 'bg-red-400' },
  { max: 50, level: 2, label: 'Low', color: 'bg-amber-500/35 border-amber-500/10', dot: 'bg-amber-400' },
  { max: 200, level: 3, label: 'Healthy', color: 'bg-brand-primary/50 border-brand-primary/15', dot: 'bg-brand-primary' },
  { max: Infinity, level: 4, label: 'Overflow', color: 'bg-brand-primary shadow-[0_0_10px_rgba(193,255,0,0.25)] border-brand-primary/30', dot: 'bg-brand-primary' },
];

const getStockLevel = (stock) => {
  return STOCK_THRESHOLDS.find((t) => stock <= t.max) || STOCK_THRESHOLDS[STOCK_THRESHOLDS.length - 1];
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getWeekNumber = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
};

const getQuarterStart = (date) => {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
};

const StockHeatmap = ({ products = [] }) => {
  const [timeframe, setTimeframe] = useState('yearly');

  // Extract real categories from products
  const { categories, totalStock, totalProducts } = useMemo(() => {
    const catMap = new Map();
    let stock = 0;

    for (const p of products) {
      const catName = p.category?.name || p.category || 'Uncategorized';
      if (!catMap.has(catName)) {
        catMap.set(catName, { name: catName, count: 0, stock: 0 });
      }
      const entry = catMap.get(catName);
      entry.count += 1;
      entry.stock += p.stock || 0;
      stock += p.stock || 0;
    }

    const sorted = [...catMap.values()]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 8);

    return {
      categories: sorted,
      totalStock: stock,
      totalProducts: products.length,
    };
  }, [products]);

  // Build heatmap grid from real data
  const { cols, gridData, timeRangeLabel, tooltipData } = useMemo(() => {
    const now = new Date();

    if (timeframe === 'weekly') {
      // Current week: Mon-Sun
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const grid = categories.map(() => new Array(7).fill(0));
      const tips = categories.map(() => new Array(7).fill(null).map(() => ({ products: 0, stock: 0 })));

      for (const p of products) {
        const updated = new Date(p.updatedAt || p.createdAt);
        if (updated < weekStart) continue;

        const dayIdx = (updated.getDay() + 6) % 7; // Mon=0
        const catName = p.category?.name || p.category || 'Uncategorized';
        const catIdx = categories.findIndex((c) => c.name === catName);
        if (catIdx === -1) continue;

        grid[catIdx][dayIdx] += p.stock || 0;
        tips[catIdx][dayIdx].products += 1;
        tips[catIdx][dayIdx].stock += p.stock || 0;
      }

      return {
        cols: DAY_LABELS,
        gridData: grid,
        timeRangeLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tooltipData: tips,
      };
    }

    if (timeframe === 'quarterly') {
      // 12 weeks of current quarter
      const qStart = getQuarterStart(now);
      const grid = categories.map(() => new Array(12).fill(0));
      const tips = categories.map(() => new Array(12).fill(null).map(() => ({ products: 0, stock: 0 })));

      for (const p of products) {
        const created = new Date(p.createdAt);
        if (created < qStart) continue;

        const weekIdx = Math.min(Math.floor((created - qStart) / (7 * 86400000)), 11);
        const catName = p.category?.name || p.category || 'Uncategorized';
        const catIdx = categories.findIndex((c) => c.name === catName);
        if (catIdx === -1) continue;

        grid[catIdx][weekIdx] += p.stock || 0;
        tips[catIdx][weekIdx].products += 1;
        tips[catIdx][weekIdx].stock += p.stock || 0;
      }

      const qNames = ['Q1', 'Q2', 'Q3', 'Q4'];
      const q = Math.floor(now.getMonth() / 3);
      return {
        cols: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
        gridData: grid,
        timeRangeLabel: `${qNames[q]} ${now.getFullYear()}`,
        tooltipData: tips,
      };
    }

    // Yearly: 12 months
    const grid = categories.map(() => new Array(12).fill(0));
    const tips = categories.map(() => new Array(12).fill(null).map(() => ({ products: 0, stock: 0 })));

    for (const p of products) {
      const created = new Date(p.createdAt);
      const monthIdx = created.getMonth();
      const catName = p.category?.name || p.category || 'Uncategorized';
      const catIdx = categories.findIndex((c) => c.name === catName);
      if (catIdx === -1) continue;

      grid[catIdx][monthIdx] += p.stock || 0;
      tips[catIdx][monthIdx].products += 1;
      tips[catIdx][monthIdx].stock += p.stock || 0;
    }

    return {
      cols: MONTH_LABELS,
      gridData: grid,
      timeRangeLabel: `${now.getFullYear()}`,
      tooltipData: tips,
    };
  }, [timeframe, products, categories]);

  const getCellColor = (stock) => {
    return getStockLevel(stock).color;
  };

  // Loading skeleton
  if (!products.length) {
    return (
      <div className="bg-app-card rounded-[2.5rem] p-8 border border-border-base shadow-soft min-h-[320px]">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-app-panel rounded w-40" />
          <div className="h-2 bg-app-panel rounded w-60" />
          <div className="grid grid-cols-12 gap-2">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-app-panel/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-card rounded-[2.5rem] p-8 border border-border-base hover:border-brand-primary/20 shadow-soft flex flex-col min-h-[320px] relative overflow-hidden group transition-all duration-300">

      {/* Subtle top-right glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10">
        <div>
          <h3 className="text-xs font-black text-app-text tracking-[0.2em] uppercase italic">Stock Heatmap</h3>
          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">
            {totalProducts} products · {totalStock.toLocaleString()} total units
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-app-panel p-1 rounded-full border border-border-base">
            {['weekly', 'quarterly', 'yearly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-brand-primary text-black font-black'
                    : 'text-app-text/60 hover:text-app-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="px-2.5 py-1.5 rounded-full border border-border-base text-[8px] font-black uppercase tracking-widest text-app-text/60 bg-app-panel/50">
            {timeRangeLabel}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 relative z-10">
        {STOCK_THRESHOLDS.map((t) => (
          <div key={t.level} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-[2px] ${t.dot}`} />
            <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">
              {t.level === 1 ? '0-10' : t.level === 2 ? '11-50' : t.level === 3 ? '51-200' : '200+'}
            </span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted text-[10px] font-bold uppercase tracking-widest">
          No product data available
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-[70px_1fr] gap-x-4 overflow-hidden relative z-10">
          {/* Empty spacer for top-left */}
          <div />

          {/* Header (Days/Weeks/Months) */}
          <div className={`grid ${timeframe === 'weekly' ? 'grid-cols-7' : 'grid-cols-12'} gap-1.5 mb-2`}>
            {cols.map((col, i) => (
              <div key={i} className="text-center text-[9px] font-black text-app-text/25 uppercase tracking-tight">
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {categories.map((cat, rowIdx) => (
            <React.Fragment key={cat.name}>
              <div className="text-[9px] font-black text-app-text/50 uppercase tracking-wider flex items-center h-7 italic">
                {cat.name}
              </div>
              <div className={`grid ${timeframe === 'weekly' ? 'grid-cols-7' : 'grid-cols-12'} gap-1.5 mb-2`}>
                {gridData[rowIdx].map((stockVal, colIdx) => {
                  const tip = tooltipData?.[rowIdx]?.[colIdx];
                  const level = getStockLevel(stockVal);
                  const isEmpty = stockVal === 0;

                  return (
                    <div
                      key={colIdx}
                      title={`${cat.name} — ${cols[colIdx]}: ${stockVal} units${tip ? ` (${tip.products} products)` : ''}`}
                      className={`w-full aspect-square rounded-[3px] border transition-all duration-300 hover:scale-110 hover:border-brand-primary/50 cursor-pointer shadow-sm ${
                        isEmpty
                          ? 'bg-white/[0.03] border-white/5'
                          : `${level.color}`
                      }`}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockHeatmap;
