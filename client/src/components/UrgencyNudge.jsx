import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// ─── Animated countdown ──────────────────────────────────────────────────────
const useCountdown = (durationSeconds) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0"));
};

// ─── Chip ────────────────────────────────────────────────────────────────────
const Chip = ({ value, label }) => (
  <div className="bg-[#0e0e0e] border border-white/10 rounded-xl px-2.5 py-2 flex flex-col items-center gap-1 min-w-[52px]">
    <span className="text-lg font-black text-white font-mono leading-none">
      {value}
    </span>
    <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">
      {label}
    </span>
  </div>
);

// ─── Pulsing dot ─────────────────────────────────────────────────────────────
const PulseDot = () => (
  <div className="mv-pulse" aria-hidden="true" />
);

// ─── Size chip ───────────────────────────────────────────────────────────────
const SizeChip = ({ size, selected, outOfStock, onClick }) => (
  <button
    type="button"
    onClick={() => !outOfStock && onClick(size)}
    disabled={outOfStock}
    aria-label={outOfStock ? `Size ${size} out of stock` : `Select size ${size}`}
    aria-pressed={selected}
    className={`text-[11px] font-black px-4 py-2.5 rounded-full border transition-all active:scale-95 duration-150 uppercase tracking-widest ${
      selected 
        ? "bg-brand-primary text-black border-brand-primary font-black shadow-[0_0_15px_rgba(193,255,0,0.3)] scale-105" 
        : outOfStock 
          ? "bg-white/5 text-white/20 border-white/5 line-through cursor-not-allowed" 
          : "bg-white/5 text-white/90 border-white/20 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/10 hover:shadow-[0_0_10px_rgba(193,255,0,0.15)] cursor-pointer"
    }`}
  >
    {size}
  </button>
);

// ─── Main UrgencyNudge component ─────────────────────────────────────────────
export const UrgencyNudge = ({
  remainingCount = 4,
  selectedSize = "",
  onSizeChange,
  sizes = [],
  viewersLastHour = 18,
  dealDurationSeconds = 9650, // ~2h 47m 30s
  soldPercent = 82,
}) => {
  const [hh, mm, ss] = useCountdown(dealDurationSeconds);
  const currentSize = sizes.find((s) => s.size === selectedSize);
  const stockLeft = currentSize?.stock ?? remainingCount;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
      {/* Top section */}
      <div className="p-5 md:p-6 flex items-start justify-between gap-6 border-b border-white/5">
        {/* Left */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <PulseDot />
            <span className="text-sm font-black uppercase tracking-tight text-white italic">
              {!selectedSize
                ? `Only ${stockLeft} left in stock`
                : currentSize && Number(currentSize.stock) === 0
                  ? `Size ${selectedSize} is sold out`
                  : `Only ${stockLeft} left in size ${selectedSize}`}
            </span>
          </div>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider pl-5">
            {viewersLastHour} people viewed this in the last hour
          </p>
          {/* Size strip */}
          <div className="flex gap-2 flex-wrap pl-5">
            {sizes.map(({ size, stock }) => {
              const outOfStock = Number(stock) === 0;
              return (
                <SizeChip
                  key={size}
                  size={size}
                  selected={selectedSize === size}
                  outOfStock={outOfStock}
                  onClick={onSizeChange}
                />
              );
            })}
          </div>
        </div>

        {/* Right — countdown */}
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          <p className="text-[9px] font-black tracking-widest text-white/30 uppercase">
            Deal ends in
          </p>
          <div className="flex gap-1.5">
            <Chip value={hh} label="HRS" />
            <Chip value={mm} label="MIN" />
            <Chip value={ss} label="SEC" />
          </div>
        </div>
      </div>

      {/* Stock bar */}
      <div className="p-4 md:p-5">
        <div className="flex justify-between items-center mb-2 text-xs font-black uppercase tracking-widest">
          <span className="text-red-500 animate-pulse">
            Selling fast
          </span>
          <span className="text-white/40">
            {soldPercent}% sold
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            style={{ width: `${soldPercent}%` }}
            className="h-full bg-gradient-to-r from-red-500 to-[#ff6b35] rounded-full transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
};

export default UrgencyNudge;
