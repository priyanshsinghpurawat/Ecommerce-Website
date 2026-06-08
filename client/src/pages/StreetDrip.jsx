import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/product.service.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

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
      const titles = [
        'Multicolour Printed Checks Shirt',
        'Cyberpunk Cargo Joggers',
        'Minimal Logo Tee — White',
        'Graffiti Oversized Hoodie',
        'Neon Stitch Utility Vest',
        'Distressed Patchwork Jeans'
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
      image: 'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1600&auto=format&fit=crop',
      title: 'THE CHECKS REVIVAL',
      subtitle: 'VOL. 01',
      description: 'Oversized layers, rugged prints, and drop-shoulder comfort built for the streets.',
      hotspots: [
        {
          id: 'shirt',
          cx: 520,
          cy: 320,
          productTitle: 'Multicolour Printed Checks Shirt',
          label: 'Printed Checks Shirt',
          description: '100% Brushed Cotton'
        },
        {
          id: 'tee',
          cx: 460,
          cy: 450,
          productTitle: 'Minimal Logo Tee — White',
          label: 'Minimal Logo Tee',
          description: '240 GSM Combed Cotton'
        },
        {
          id: 'pants',
          cx: 480,
          cy: 720,
          productTitle: 'Cyberpunk Cargo Joggers',
          label: 'Cyberpunk Joggers',
          description: 'Tapered Utility Fit'
        }
      ]
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1600&auto=format&fit=crop',
      title: 'INDUSTRIAL UTILITY',
      subtitle: 'VOL. 02',
      description: 'Heavy fleece, tactical vests, and custom distressed denim designed for high-contrast layering.',
      hotspots: [
        {
          id: 'hoodie',
          cx: 540,
          cy: 400,
          productTitle: 'Graffiti Oversized Hoodie',
          label: 'Graffiti Hoodie',
          description: 'Ultra-Heavy Fleece'
        },
        {
          id: 'vest',
          cx: 380,
          cy: 460,
          productTitle: 'Neon Stitch Utility Vest',
          label: 'Utility Vest',
          description: 'Water-resistant Tactical'
        },
        {
          id: 'jeans',
          cx: 500,
          cy: 740,
          productTitle: 'Distressed Patchwork Jeans',
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
    <div className="space-y-16 pb-20 -mx-4 md:-mx-0">
      {/* Immersive Street Drip Hero Section */}
      <section className="relative w-full overflow-hidden rounded-[2rem] md:rounded-[3.5rem] bg-black min-h-[650px] md:min-h-[800px] lg:min-h-[90vh] shadow-2xl mx-auto max-w-full group">
        
        {/* SVG Container wrapping background image and interactive touchpoints */}
        <div className="absolute inset-0 w-full h-full">
          <svg viewBox="0 0 1000 1000" className="w-full h-full object-cover select-none" preserveAspectRatio="xMidYMid slice">
            <AnimatePresence mode="wait">
              <motion.g
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* SVG-rendered Image */}
                <image
                  href={slides[currentSlide].image}
                  width="1000"
                  height="1000"
                  preserveAspectRatio="xMidYMin slice"
                  opacity="0.85"
                />

                {/* SVG Touchpoints mapped with absolute coordinate circles */}
                {slides[currentSlide].hotspots.map((spot) => {
                  const isActive = activeHotspot === spot.id;
                  return (
                    <g 
                      key={spot.id} 
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveHotspot(isActive ? null : spot.id);
                      }}
                    >
                      {/* Pulsing ring animation */}
                      <circle cx={spot.cx} cy={spot.cy} r="25" className="fill-lux-primary/20 pointer-events-none">
                        <animate attributeName="r" values="12;26;12" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                      </circle>
                      {/* Static Touchpoint Outer Border */}
                      <circle cx={spot.cx} cy={spot.cy} r="13" className="fill-lux-primary/80 stroke-white stroke-2 transition-transform duration-300 group-hover:scale-110" />
                      {/* Visual Plus (+) icon on touchpoint */}
                      <path d={`M ${spot.cx - 4.5} ${spot.cy} H ${spot.cx + 4.5} M ${spot.cx} ${spot.cy - 4.5} V ${spot.cx} ${spot.cy + 4.5}`} stroke="black" strokeWidth="2.2" strokeLinecap="round" />
                    </g>
                  );
                })}
              </motion.g>
            </AnimatePresence>
          </svg>

          {/* Touchpoint HTML Overlay Cards positioned dynamically */}
          {slides[currentSlide].hotspots.map((spot) => {
            const matchedProd = hotspotProducts[spot.productTitle];
            const isActive = activeHotspot === spot.id;

            return (
              <div
                key={spot.id}
                className="absolute z-30 pointer-events-none transition-all duration-300"
                style={{ top: `${spot.cy / 10}%`, left: `${spot.cx / 10}%` }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-56 bg-black/95 backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-2xl text-left pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[9px] font-black tracking-widest text-lux-primary uppercase mb-1">
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
                                ₹{matchedProd.discountedPrice || matchedProd.price}
                              </span>
                              {matchedProd.discountedPrice && (
                                <span className="text-[9px] font-bold text-white/40 line-through ml-1.5">
                                  ₹{matchedProd.price}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-black text-white/50">Loading...</span>
                          )}
                        </div>
                        {matchedProd ? (
                          <Link
                            to={`/product/${matchedProd._id}`}
                            className="flex items-center gap-1 bg-lux-primary text-black rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                          >
                            View <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        ) : (
                          <span className="text-[9px] text-white/30 font-bold uppercase">Stocking</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Dark Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />

        {/* Hero Slide Details */}
        <div className="relative z-20 flex h-full min-h-[650px] md:min-h-[800px] lg:min-h-[90vh] flex-col justify-center p-8 md:p-24 md:max-w-3xl text-left pointer-events-none">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lux-primary mb-4 italic flex items-center gap-2 pointer-events-auto">
            <Sparkles className="h-4 w-4" /> Streetwear Curation {slides[currentSlide].subtitle}
          </span>
          <h1 className="font-sans text-5xl md:text-8xl font-black text-white leading-[0.9] italic tracking-tighter uppercase pointer-events-auto">
            {slides[currentSlide].title}
          </h1>
          <p className="mt-6 max-w-md text-sm text-white/70 leading-relaxed font-bold uppercase tracking-tight pointer-events-auto">
            {slides[currentSlide].description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 pointer-events-auto">
            <button
              onClick={() => {
                const el = document.getElementById('grid-anchor');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all shadow-2xl"
            >
              Explore Collection
            </button>
            <span className="hidden sm:inline-flex items-center text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 border border-white/10 rounded-full px-6 py-3.5 backdrop-blur-md">
              Tap touchpoints ⊕ on image to shop details
            </span>
          </div>
        </div>

        {/* Sliders navigation */}
        <button
          type="button"
          onClick={handlePrevSlide}
          className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-white/5 p-3 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={handleNextSlide}
          className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-white/5 p-3 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Carousel indicators */}
        <div className="absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveHotspot(null);
                setCurrentSlide(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-10 bg-lux-primary shadow-lg shadow-lux-primary/50' : 'w-3 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Product List Grid Container */}
      <div id="grid-anchor" className="space-y-8 px-4 md:px-0 scroll-mt-24">
        <div className="border-b border-lux-100 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-primary">
              Exclusive Drop
            </p>
            <h2 className="text-3xl font-black uppercase italic text-lux-dark mt-1">
              Shop Street Drip
            </h2>
            <p className="text-xs text-lux-dark/40 uppercase font-bold mt-1">
              Limited items, premium fits, and distressed patterns
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-lux-50 border border-lux-100 px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-lux-dark tracking-wider">
            <ShoppingBag className="h-4 w-4 text-lux-primary animate-pulse" /> {products.length} Drops Live
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
          <div className="rounded-[3rem] border border-dashed border-lux-200 py-24 px-8 text-center bg-lux-50/30">
            <h3 className="text-lg font-bold text-lux-dark">No Street Drip items currently live</h3>
            <p className="text-sm text-lux-dark/40 mt-2 max-w-xs mx-auto">
              Please seed products or add the 'street-drip' badge to some products.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
