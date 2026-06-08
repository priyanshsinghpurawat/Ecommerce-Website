import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import { useCategories } from '../hooks/useCategories.js';
import { getSubcategories } from '../services/subcategory.service.js';
import * as productService from '../services/product.service.js';
import { HeroCarousel } from '../components/HeroCarousel.jsx';
import { ProductShowcase } from '../components/ProductShowcase.jsx';
import { ProductCardSkeleton } from '../components/Skeleton.jsx';
import { CATEGORY_BANNERS, FEATURED_SUBCATEGORY_NAMES } from '../constants/showcase.js';
import { Sparkles, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export const Home = () => {
  const { products, loading, fetchProducts } = useProducts();
  const { categories, fetchCategories } = useCategories();
  const [subcategories, setSubcategories] = useState([]);
  const [sportswear, setSportswear] = useState([]);
  const [pants, setPants] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const checkedShirts = useMemo(
    () =>
      products.filter((p) =>
        /check|plaid|gingham|tartan/i.test(p.title)
      ),
    [products]
  );

  useEffect(() => {
    fetchProducts({ page: 1, limit: 12, sort: 'latest' });
    fetchCategories();
    getSubcategories()
      .then((res) => setSubcategories(res?.data || []))
      .catch(() => setSubcategories([]));
    
    // Fetch sale products specifically
    productService.getProducts({ limit: 5, sort: 'latest' }) // Ideally we'd have a badge filter in the API
      .then((res) => {
        const all = res?.data?.products || [];
        setSaleProducts(all.filter(p => p.badge === 'sale' || (p.discountedPrice > 0 && p.discountedPrice < p.price)));
      })
      .catch(() => setSaleProducts([]));
  }, [fetchProducts, fetchCategories]);

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
        const sportId = subBySlug.sportswear?._id;
        const pantsId = subBySlug.pants?._id;
        const tasks = [];
        if (sportId) {
          tasks.push(
            productService
              .getProducts({ subcategory: sportId, limit: 5 })
              .then((res) => setSportswear(res?.data?.products || []))
              .catch(() => setSportswear([]))
          );
        }
        if (pantsId) {
          tasks.push(
            productService
              .getProducts({ subcategory: pantsId, limit: 5 })
              .then((res) => setPants(res?.data?.products || []))
              .catch(() => setPants([]))
          );
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
    <div className="space-y-12 md:space-y-16 pb-20 -mx-4 md:-mx-0">
      <div className="px-0 md:px-0">
        <HeroCarousel />
      </div>

      {/* Trending subcategory chips — Powerlook-style nav */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeInUp}
        className="px-4 md:px-0 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-lux-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] gradient-primary gradient-text">
            Trending now
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            to="/shop?sort=latest"
            className="shrink-0 rounded-full border border-lux-dark bg-lux-dark px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-lux-bg hover:opacity-90 transition-all shadow-lg shadow-lux-dark/10"
          >
            New arrivals
          </Link>
          {featuredSubs.map((sub) => (
            <Link
              key={sub._id}
              to={`/shop?subcategory=${sub._id}`}
              className="shrink-0 rounded-full border border-border-base bg-lux-100 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-lux-dark hover:border-lux-primary hover:text-lux-primary transition-all shadow-sm"
            >
              {sub.name}
            </Link>
          ))}
          <Link
            to="/shop"
            className="shrink-0 rounded-full border-2 border-dashed border-border-base px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted hover:border-lux-primary hover:text-lux-primary transition-all"
          >
            Shop all
          </Link>
        </div>
      </motion.section>

      {/* Promo strip */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeInUp}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 md:px-0"
      >
        {[
          { icon: Sparkles, label: 'Free shipping', text: 'On all orders across India' },
          { icon: Zap, label: 'COD available', text: 'Pay when your order arrives' },
          { icon: Flame, label: 'Fresh drops', text: 'Curated weekly releases' }
        ].map(({ icon: Icon, label, text }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-[2rem] border border-border-base bg-lux-100 p-6 shadow-soft hover:acid-glow transition-all duration-500 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lux-dark text-lux-primary shadow-lg transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-lux-dark">{label}</p>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tight mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Category banners */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="px-4 md:px-0 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-lux-dark">The Collections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const banner = CATEGORY_BANNERS[cat.name] || CATEGORY_BANNERS.Clothing;
            return (
              <Link
                key={cat._id}
                to={`/shop?category=${cat._id}`}
                className="group relative h-48 sm:h-56 rounded-[2.5rem] overflow-hidden shadow-soft"
              >
                <img
                  src={banner.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-7 left-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lux-primary mb-1">
                    {banner.tagline}
                  </p>
                  <span className="text-3xl font-black text-white uppercase italic tracking-tighter">{cat.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.section>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="px-4 md:px-0"
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
          className="px-4 md:px-0"
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

      {/* Full-width CTA */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="mx-4 md:mx-0 rounded-[3rem] bg-lux-dark border border-white/10 px-10 py-16 text-center md:text-left md:flex md:items-center md:justify-between overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-lux-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-lux-primary italic">
            MensVibe · Jaipur Studio
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black text-lux-primary tracking-[0.4em] uppercase tracking-tighter leading-tight">
            Redefining the <br />modern silhouette
          </h2>
          <p className="mt-4 text-sm text-lux-primary max-w-sm font-medium">
            From experimental streetwear to artisanal footwear. Crafted for those who move differently.
          </p>
        </div>
        <Link
          to="/shop"
          className="mt-8 md:mt-0 inline-flex rounded-2xl bg-lux-primary px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-transform shadow-lg shadow-lux-primary/20 relative z-10"
        >
          Enter Shop
        </Link>
      </motion.section>
    </div>
  );
};
