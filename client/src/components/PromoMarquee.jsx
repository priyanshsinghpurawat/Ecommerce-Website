import { Truck, Zap, Tag } from 'lucide-react';

const PROMOS = [
  { icon: Truck, text: 'FREE SHIPPING ON ₹999+' },
  { icon: Zap, text: 'STREET DRIP COLLECTION OUT NOW' },
  { icon: Tag, text: 'USE WELCOME50 FOR ₹50 OFF' },
  { icon: Truck, text: 'FREE SHIPPING ON ₹999+' },
  { icon: Zap, text: 'STREET DRIP COLLECTION OUT NOW' },
  { icon: Tag, text: 'USE WELCOME50 FOR ₹50 OFF' },
];

export const PromoMarquee = () => {
  return (
    <div className="bg-brand-primary text-black overflow-hidden py-1.5 relative">
      <div className="animate-marquee flex whitespace-nowrap">
        {PROMOS.map((promo, i) => {
          const Icon = promo.icon;
          return (
            <span key={i} className="flex items-center gap-2 mx-6 text-[9px] font-black uppercase tracking-widest">
              <Icon className="h-3 w-3" />
              {promo.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
