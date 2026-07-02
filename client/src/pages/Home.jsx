import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import { useSubcategories } from '../hooks/useSubcategories.js';
import * as productService from '../services/product.service.js';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { ProductShowcase } from '../components/ProductShowcase.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { CATEGORY_BANNERS, FEATURED_SUBCATEGORY_NAMES } from '../constants/showcase.js';
import { SEO } from '../components/SEO.jsx';
import { Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCache, setCache } from '../utils/helpers.js';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const CACHE_TTL = 60000; // 1 minute

async function fetchWithCache(key, fetcher, ttl = CACHE_TTL) {
  const cached = getCache(key);
  if (cached) return cached;
  const data = await fetcher();
  setCache(key, data, ttl);
  return data;
}

export const Home = () => {
  const { products, loading, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const { subcategories, fetchSubcategories } = useSubcategories();
  const [linen, setLinen] = useState([]);
  const [pants, setPants] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const fetchRef = useRef({});

  useEffect(() => {
    fetchProducts({ page: 1, limit: 12, sort: 'latest' });
    fetchCategories();
    fetchSubcategories();
    
    // Fetch sale products using the badge filter
    fetchWithCache('home:sale', () => productService.getProducts({ limit: 10, badge: 'sale' }))
      .then((res) => {
        setSaleProducts(res?.data?.products || []);
      })
      .catch(() => setSaleProducts([]));
  }, [fetchProducts, fetchCategories, fetchSubcategories]);

  const subBySlug = useMemo(() => {
    const map = {};
    for (const s of subcategories) {
      map[s.slug] = s;
    }
    return map;
  }, [subcategories]);

  useEffect(() => {
    const loadSections = async () => {
      setLoadingSections(true);
      try {
        const linenId = subBySlug.linen?._id;
        const pantsId = subBySlug.pants?._id;
        const tasks = [];
        
        if (linenId) {
          const key = `home:linen:${linenId}`;
          if (!fetchRef.current[key]) {
            fetchRef.current[key] = fetchWithCache(key, () => 
              productService.getProducts({ subcategory: linenId, limit: 5 })
            ).then((res) => setLinen(res?.data?.products || []))
              .catch(() => setLinen([]));
            tasks.push(fetchRef.current[key]);
          }
        }
        if (pantsId) {
          const key = `home:pants:${pantsId}`;
          if (!fetchRef.current[key]) {
            fetchRef.current[key] = fetchWithCache(key, () => 
              productService.getProducts({ subcategory: pantsId, limit: 5 })
            ).then((res) => setPants(res?.data?.products || []))
              .catch(() => setPants([]));
            tasks.push(fetchRef.current[key]);
          }
        }
        await Promise.all(tasks);
      } finally {
        setLoadingSections(false);
      }
    };
    if (Object.keys(subBySlug).length > 0) loadSections();
    else setLoadingSections(false);
  }, [subBySlug]);

  const featuredSubs = FEATURED_SUBCATEGORY_NAMES.map((name) =>
    subcategories.find((s) => s.name === name)
  ).filter(Boolean);

  return (
    <div className="space-y-6 md:space-y-8 pb-6">
      <SEO title="Home" description="Premium streetwear and drip clothing for men. Shop the latest collections at MensVibe." image="/assets/hero_street.png" />
      <HeroCarousel />

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="px-0"
      >
        <ProductShowcase
          title="New drops"
          subtitle="The latest essentials"
          products={products}
          loading={loading}
          viewAllLink="/shop?sort=latest"
        />
      </motion.div>

      {saleProducts.length > 0 && (
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="px-0"
        >
          <ProductShowcase
            title="Flash Sale"
            subtitle="Archive pricing"
            products={saleProducts}
            loading={false}
            viewAllLink="/shop?badge=sale"
          />
        </motion.div>
      )}

      {linen.length > 0 && (
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="px-0"
        >
          <ProductShowcase
            title="Linen Collection"
            subtitle="Breathable, relaxed summer styles"
            products={linen}
            loading={loadingSections}
            viewAllLink={subBySlug.linen?._id ? `/shop?subcategory=${subBySlug.linen._id}` : '/shop'}
          />
        </motion.div>
      )}

      {pants.length > 0 && (
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="px-0"
        >
          <ProductShowcase
            title="Premium Trousers & Pants"
            subtitle="Tailored & cargo fits"
            products={pants}
            loading={loadingSections}
            viewAllLink={subBySlug.pants?._id ? `/shop?subcategory=${subBySlug.pants._id}` : '/shop'}
          />
        </motion.div>
      )}



      {/* Full-width CTA */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="mx-0 rounded-[3rem] glass shadow-soft px-10 py-16 text-center md:text-left md:flex md:items-center md:justify-between overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary italic">
            MensVibe · Jaipur Studio
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black text-app-text tracking-tighter uppercase leading-tight">
            Redefining the <br /><span className="text-brand-primary">modern silhouette</span>
          </h2>
          <p className="mt-4 text-sm text-app-text/70 max-w-sm font-medium uppercase tracking-tight">
            From experimental streetwear to artisanal footwear. Crafted for those who move differently.
          </p>
        </div>
        <Link
          to="/shop"
          className="mt-8 md:mt-0 inline-flex rounded-2xl bg-brand-primary px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20 relative z-10"
        >
          Enter Shop
        </Link>
      </motion.section>

      {/* Promo strip */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeInUp}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-0"
      >
        {[
          { icon: Flame, label: 'Free shipping', text: 'On all orders across India' },
          { icon: Zap, label: 'COD available', text: 'Pay when your order arrives' },
          { icon: Flame, label: 'Fresh drops', text: 'Curated weekly releases' }
        ].map(({ icon: Icon, label, text }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-[#121212]/95 backdrop-blur-xl p-6 shadow-soft hover:acid-glow transition-all duration-500 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary border border-brand-primary/20 shadow-lg transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-app-text">{label}</p>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tight mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Infinite Scrolling Brand Ethos Marquee */}
      <div className="w-full overflow-hidden bg-white/[0.02] py-8 border-y border-white/5 select-none -mx-4 md:mx-0">
        <div className="animate-marquee whitespace-nowrap text-2xl md:text-4xl font-black uppercase tracking-[0.3em] italic flex gap-4">
          <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse">
            MENSVIBE STUDIO · <span className="text-brand-primary drop-shadow-none">DRIP OR DROWN</span> · JAIPUR CREATIVE LAB · <span className="text-brand-primary drop-shadow-none">LIMITED RELEASES</span> · STREETWEAR REVOLUTION · &nbsp;
          </span>
          <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse">
            MENSVIBE STUDIO · <span className="text-brand-primary drop-shadow-none">DRIP OR DROWN</span> · JAIPUR CREATIVE LAB · <span className="text-brand-primary drop-shadow-none">LIMITED RELEASES</span> · STREETWEAR REVOLUTION · &nbsp;
          </span>
        </div>
      </div>
    </div>
  );
};
