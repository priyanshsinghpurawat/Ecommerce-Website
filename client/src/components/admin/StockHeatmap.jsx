import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * StockHeatmap Component
 * A clean, modern SaaS-style heatmap for stock inventory.
 * Fully theme-consistent with app- variables and Acid Green accents.
 */
const StockHeatmap = () => {
  const categories = ['Apparel', 'Beauty', 'Food', 'Fashion'];
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Mock data for the heatmap grid (4 categories x 7 days)
  const heatmapData = [
    [2, 3, 4, 1, 2, 4, 3], // Apparel
    [1, 2, 2, 3, 4, 2, 1], // Beauty
    [3, 4, 3, 2, 1, 3, 4], // Food
    [2, 1, 4, 3, 2, 1, 2], // Fashion
  ];

  const getColorClass = (val) => {
    switch (val) {
      case 1: return 'bg-brand-primary/10';
      case 2: return 'bg-brand-primary/30';
      case 3: return 'bg-brand-primary/60';
      case 4: return 'bg-brand-primary';
      default: return 'bg-brand-primary/10';
    }
  };

  return (
    <div className="bg-app-card rounded-[2.5rem] p-8 shadow-soft border border-border-base h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-app-text tracking-tight uppercase italic">Stock Product</h3>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Average total Product</p>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 rounded-full border border-border-base text-[9px] font-black uppercase tracking-widest text-app-text/60 hover:bg-app-panel transition-colors">
          June <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-primary/30" />
          <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">101-200</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-primary/60" />
          <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">201-300</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-brand-primary" />
          <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">301-400</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[70px_1fr] gap-x-4">
        {/* Empty spacer for top-left */}
        <div />
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {days.map((day, i) => (
            <div key={i} className="text-center text-[9px] font-black text-app-text/20 uppercase tracking-tighter">
              {day}
            </div>
          ))}
        </div>

        {/* Rows */}
        {categories.map((cat, rowIdx) => (
          <React.Fragment key={cat}>
            <div className="text-[10px] font-black text-app-text/40 uppercase tracking-tighter flex items-center h-6 italic">
              {cat}
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {heatmapData[rowIdx].map((val, colIdx) => (
                <div 
                  key={colIdx} 
                  className={`w-full aspect-square rounded-[4px] ${getColorClass(val)} transition-all duration-300 hover:scale-110 cursor-pointer shadow-sm hover:shadow-brand-primary/20`}
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
