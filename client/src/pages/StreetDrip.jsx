import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/api.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../utils/helpers.js';

export const StreetDrip = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [hotspotProducts, setHotspotProducts] = useState({});

  // Fetch all street drip products for the grid
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await getProducts({ badge: 'street-drip', limit: 15 });
        setProducts(res?.data?.products || []);
      } catch (err) {
        toast.error('Failed to load Street Drip collection.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Fetch specific products for interactive hotspots to get their real DB IDs and live prices
  useEffect(() => {
    const loadHotspotProducts = async () => {
      // These names must exactly match the seeder titles
      const titles = [
        'superman vintage black T-shirt',
        'Black Slim Denim',
        'Dark Grey Men Cargo',
        'Heavyweight Sand Hoodie',
        'Vintage Plaid Overshirt'
      ];
      
      const mapped = {};
      await Promise.all(
        titles.map(async (title) => {
          try {
            const res = await getProducts({ search: title, limit: 1 });
            const prod = res?.data?.products?.[0];
            if (prod) {
              mapped[title] = prod;
            }
          } catch (e) {
            console.error('Failed to fetch hotspot product:', title);
          }
        })
      );
      setHotspotProducts(mapped);
    };
    loadHotspotProducts();
  }, []);

  const slides = [
    {
      id: 1,
      image: '/assets/hero_casual.png',
      title: 'THE STREET UTILITY',
      subtitle: 'VOL. 01',
      description: 'Oversized layers, rugged cargo cuts, and drop-shoulder comfort built for the streets.',
      hotspots: [
        {
          id: 'overshirt',
          cx: 380,
          cy: 450,
          productTitle: 'Vintage Plaid Overshirt',
          label: 'Plaid Overshirt',
          description: 'Relaxed Fit Outerwear',
          hardcodedLink: '/product/6a27ed6aad7d78cd89ec2266'
        },
        {
          id: 'tshirt',
          cx: 520,
          cy: 290,
          productTitle: 'superman vintage black T-shirt',
          label: 'Oversized Layer',
          description: 'Heavyweight Cotton',
          hardcodedLink: '/product/6a27ebfaad7d78cd89ec2128'
        },
        {
          id: 'pants',
          cx: 500,
          cy: 550,
          productTitle: 'Dark Grey Men Cargo',
          label: 'Utility Cargo Pants',
          description: 'Reinforced Multi-Pocket',
          hardcodedLink: '/product/6a27e842ad7d78cd89ec1f43'
        }
      ]
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1600&auto=format&fit=crop',
      title: 'INDUSTRIAL UTILITY',
      subtitle: 'VOL. 02',
      description: 'Heavy fleece, distressed denim, and raw-edge patchwork designed for high-contrast layering.',
      hotspots: [
        {
          id: 'hoodie',
          cx: 470,
          cy: 380,
          productTitle: 'Heavyweight Sand Hoodie',
          label: 'Heavyweight Hoodie',
          description: '400 GSM Double-Layered Fleece'
        },
        {
          id: 'jeans',
          cx: 460,
          cy: 700,
          productTitle: 'Black Slim Denim',
          label: 'Patchwork Jeans',
          description: 'Raw Edge Distressing'
        }
      ]
    }
  ];

  const handlePrevSlide = () => {
    setActiveHotspot(null);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setActiveHotspot(null);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto px-4 md:px-0">
      {/* Immersive Street Drip Hero Section */}
      <section className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
        
        {/* Left: Image Container (takes 58% width on desktop, taller height) */}
        <div className="w-full lg:w-[58%] h-[85vh] lg:h-[100vh] relative overflow-hidden rounded-[2rem] md:rounded-[3.5rem] bg-black border border-white/10 shadow-2xl select-none group/image">
          {/* Background image — completely clear, no dark shadow overlay */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide}
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover object-[60%_top] select-none pointer-events-none"
            />
          </AnimatePresence>

          {/* Interactive hotspot dots — percentage-based positioning */}
          {slides[currentSlide].hotspots.map((spot) => {
            const isActive = activeHotspot === spot.id;
            const matchedProd = hotspotProducts[spot.productTitle];
            const leftPct = `${spot.cx / 10}%`;
            const topPct  = `${spot.cy / 10}%`;
            return (
              <div
                key={spot.id}
                className="absolute z-30"
                style={{ left: leftPct, top: topPct, transform: 'translate(-50%, -50%)' }}
              >
                {/* Pulsing dot wrapped in a Link for direct redirection */}
                <Link
                  to={matchedProd ? `/product/${matchedProd.slug || matchedProd._id}` : (spot.hardcodedLink || '#')}
                  onMouseEnter={() => setActiveHotspot(spot.id)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  className="relative flex items-center justify-center w-8 h-8 focus:outline-none"
                >
                  <span className="absolute inline-flex w-8 h-8 rounded-full bg-[#c1ff00]/30 animate-ping" />
                  <span className={`relative inline-flex w-5 h-5 rounded-full border-2 border-white shadow-lg items-center justify-center transition-all ${isActive ? 'bg-[#c1ff00] scale-110' : 'bg-[#c1ff00]'}`}>
                    <span className="w-2.5 h-0.5 bg-black absolute" />
                    <span className="w-0.5 h-2.5 bg-black absolute" />
                  </span>
                </Link>

                {/* Popup card on image hover/click (completely removed View button) */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 bg-black/95 backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-2xl text-left pointer-events-none"
                    >
                      <p className="text-[9px] font-black tracking-widest text-[#c1ff00] uppercase mb-1">
                        {spot.description}
                      </p>
                      <h4 className="text-xs font-black uppercase text-white tracking-tight line-clamp-1">
                        {spot.label}
                      </h4>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div>
                          {matchedProd ? (
                            <>
                              <span className="text-xs font-black text-white">
                                ₹{(matchedProd.discountedPrice || matchedProd.price).toLocaleString('en-IN')}
                              </span>
                              {matchedProd.discountedPrice && (
                                <span className="text-[9px] font-bold text-white/40 line-through ml-1.5">
                                  ₹{matchedProd.price.toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-white/40">Loading…</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Carousel indicators at bottom left of image */}
          <div className="absolute bottom-6 left-6 z-30 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveHotspot(null);
                  setCurrentSlide(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-8 bg-[#c1ff00] shadow-lg shadow-[#c1ff00]/50' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Wardrobe Sidebar (takes 42% width on desktop) */}
        <div className="w-full lg:w-[42%] bg-[#0a0a0a] p-6 md:p-8 lg:p-10 flex flex-col justify-between rounded-[2rem] md:rounded-[3.5rem] border border-white/10 text-white min-h-[450px] lg:min-h-auto shadow-2xl">
          <div className="space-y-8">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#c1ff00] flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Streetwear Curation {slides[currentSlide].subtitle}
              </span>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-tighter mt-2 leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1">
                Featured Wardrobe
              </p>
            </div>

            {/* Wardrobe Items List */}
            <div className="space-y-4">
              {slides[currentSlide].hotspots.map((spot) => {
                const matchedProd = hotspotProducts[spot.productTitle];
                const isActive = activeHotspot === spot.id;
                return (
                  <div
                    key={spot.id}
                    onMouseEnter={() => setActiveHotspot(spot.id)}
                    onMouseLeave={() => setActiveHotspot(null)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                      isActive 
                        ? 'bg-white/10 border-[#c1ff00]/40 shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
                    }`}
                  >
                    {/* Item Thumbnail — using resolveImageUrl */}
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center">
                      {matchedProd?.image ? (
                        <img 
                          src={resolveImageUrl(matchedProd.image, 200)} 
                          alt={matchedProd.title} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-white/30" />
                      )}
                    </div>

                    {/* Item Text details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#c1ff00] mb-0.5">
                        {spot.description}
                      </p>
                      <h4 className="text-xs font-black uppercase text-white tracking-tight truncate">
                        {spot.label}
                      </h4>
                      <p className="text-xs font-black text-white/80 mt-1">
                        {matchedProd ? (
                          <>
                            ₹{(matchedProd.discountedPrice || matchedProd.price).toLocaleString('en-IN')}
                            {matchedProd.discountedPrice && (
                              <span className="text-[9px] font-bold text-white/40 line-through ml-1.5">
                                ₹{matchedProd.price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </>
                        ) : (
                          "Loading..."
                        )}
                      </p>
                    </div>

                    {/* View Action Link */}
                    <Link
                      to={matchedProd ? `/product/${matchedProd.slug || matchedProd._id}` : (spot.hardcodedLink || '#')}
                      className={`h-8 w-8 rounded-full flex items-center justify-center hover:scale-110 transition-all flex-shrink-0 ${
                        isActive ? 'bg-[#c1ff00] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wardrobe Footer Pagination */}
          <div className="pt-6 border-t border-white/10 mt-8 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Lookbook 0{currentSlide + 1} / 0{slides.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4 text-white/80" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="h-9 w-9 rounded-full bg-[#c1ff00] hover:bg-[#aee600] transition-colors flex items-center justify-center"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product List Grid Container */}
      <div id="grid-anchor" className="space-y-8 px-4 md:px-0 scroll-mt-24">
        <div className="border-b border-surface-100 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
              Exclusive Drop
            </p>
            <h2 className="text-3xl font-black uppercase italic text-app-text mt-1">
              Shop Street Drip
            </h2>
            <p className="text-xs text-app-text/40 uppercase font-bold mt-1">
              Limited items, premium fits, and distressed patterns
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-surface-50 border border-surface-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-app-text tracking-wider">
            <ShoppingBag className="h-4 w-4 text-brand-primary animate-pulse" /> {products.length} Drops Live
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="rounded-[3rem] border border-dashed border-surface-200 py-24 px-8 text-center bg-surface-50/30">
            <h3 className="text-lg font-bold text-app-text">No Street Drip items currently live</h3>
            <p className="text-sm text-app-text/40 mt-2 max-w-xs mx-auto">
              Please seed products or add the 'street-drip' badge to some products.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
