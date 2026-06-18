import React, { useState } from 'react';

/**
 * StockHeatmap Component
 * A clean, modern SaaS-style heatmap for stock inventory.
 * Supports Weekly, Quarterly, and Yearly timeframes dynamically.
 * Styled to match the Inventory Valuation card style in a subtle, premium way.
 */
const StockHeatmap = () => {
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'quarterly' | 'yearly'
  
  const categories = ['Apparel', 'Beauty', 'Food', 'Fashion'];
  
  // Color classification based on stock intensity level (1: low, 2: mid-low, 3: mid-high, 4: high)
  const getColorClass = (val) => {
    switch (val) {
      case 1: return 'bg-brand-primary/15';
      case 2: return 'bg-brand-primary/40';
      case 3: return 'bg-brand-primary/70';
      case 4: return 'bg-brand-primary shadow-[0_0_8px_rgba(193,255,0,0.25)]';
      default: return 'bg-brand-primary/15';
    }
  };

  // Generate dynamic data and columns based on timeframe
  const { cols, gridData, timeRangeLabel } = React.useMemo(() => {
    if (timeframe === 'weekly') {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
      return {
        cols: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        gridData: [
          [2, 3, 4, 1, 2, 4, 3], // Apparel
          [1, 2, 2, 3, 4, 2, 1], // Beauty
          [3, 4, 3, 2, 1, 3, 4], // Food
          [2, 1, 4, 3, 2, 1, 2], // Fashion
        ],
        timeRangeLabel: currentMonth
      };
    } else if (timeframe === 'quarterly') {
      // 12 Weeks representing a quarter (3 months of data)
      // Populate organically using sine wave so it looks active and impressive
      const generatedGrid = categories.map((cat, catIdx) => {
        return Array.from({ length: 12 }, (_, weekIdx) => {
          const wave = Math.sin((weekIdx + catIdx * 2) * 0.9) * 1.6;
          return Math.max(1, Math.min(4, Math.round(2.5 + wave)));
        });
      });
      return {
        cols: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
        gridData: generatedGrid,
        timeRangeLabel: 'Q2 (3 Months)'
      };
    } else {
      // Yearly: 12 months, fully populated with mock stock history (which persists over time)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      const generatedGrid = categories.map((cat, catIdx) => {
        return Array.from({ length: 12 }, (_, monthIdx) => {
          const wave = Math.cos((monthIdx + catIdx * 3) * 0.8) * 1.5;
          return Math.max(1, Math.min(4, Math.round(2.5 + wave)));
        });
      });

      return {
        cols: months,
        gridData: generatedGrid,
        timeRangeLabel: `${currentYear}`
      };
    }
  }, [timeframe]);

  return (
    <div className="bg-app-card rounded-[2.5rem] p-8 border border-border-base hover:border-brand-primary/20 shadow-soft flex flex-col min-h-[320px] relative overflow-hidden group transition-all duration-300">
      
      {/* Subtle top-right glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all duration-500" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10">
        <div>
          <h3 className="text-xs font-black text-app-text tracking-[0.2em] uppercase italic">Stock Product</h3>
          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Average total Product</p>
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
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[2px] bg-brand-primary/15" />
          <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">101-200</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[2px] bg-brand-primary/40" />
          <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">201-300</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[2px] bg-brand-primary/70" />
          <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">301-400</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[2px] bg-brand-primary shadow-[0_0_4px_rgba(193,255,0,0.5)]" />
          <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">401+</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[65px_1fr] gap-x-4 overflow-hidden relative z-10">
        {/* Empty spacer for top-left */}
        <div />
        
        {/* Header (Days/Weeks/Months) */}
        <div className={`grid ${timeframe === 'weekly' ? 'grid-cols-7' : 'grid-cols-12'} gap-2 mb-2`}>
          {cols.map((col, i) => (
            <div key={i} className="text-center text-[9px] font-black text-app-text/25 uppercase tracking-tight">
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {categories.map((cat, rowIdx) => (
          <React.Fragment key={cat}>
            <div className="text-[9px] font-black text-app-text/50 uppercase tracking-wider flex items-center h-6 italic">
              {cat}
            </div>
            <div className={`grid ${timeframe === 'weekly' ? 'grid-cols-7' : 'grid-cols-12'} gap-2 mb-2`}>
              {gridData[rowIdx].map((val, colIdx) => (
                <div 
                  key={colIdx} 
                  title={`${cat} - ${cols[colIdx]}: ${val * 120} units avg`}
                  className={`w-full aspect-square rounded-[4px] ${getColorClass(val)} border border-white/5 transition-all duration-300 hover:scale-110 hover:border-brand-primary/50 cursor-pointer shadow-sm`}
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StockHeatmap;
