import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from '../constants/showcase.js';
import { motion, AnimatePresence } from 'framer-motion';

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 4000); // Snappy 4-second scroll
    return () => clearInterval(timer);
  }, [isPaused, index]);

  const slide = HERO_SLIDES[index];

  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % HERO_SLIDES.length);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden rounded-none bg-app-bg min-h-[600px] md:min-h-[750px] lg:min-h-[85vh] shadow-soft mx-auto max-w-full group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="absolute inset-0 overflow-hidden"
        >
          {slide.image3 ? (
            // 3-column split vertical panels (Triptych)
            <div className="absolute inset-0 w-full h-full grid grid-cols-3 gap-[2px] md:gap-[4px] bg-black/10">
              <Link to={slide.link1 || slide.link} className="relative h-full w-full overflow-hidden block">
                <img
                  src={slide.image}
                  alt=""
                  className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
              </Link>
              <Link to={slide.link2 || slide.link} className="relative h-full w-full overflow-hidden block">
                <img
                  src={slide.image2}
                  alt=""
                  className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
              </Link>
              <Link to={slide.link3 || slide.link} className="relative h-full w-full overflow-hidden block">
                <img
                  src={slide.image3}
                  alt=""
                  className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
              </Link>
            </div>
          ) : slide.image2 ? (
            // 2-column split vertical panels
            <div className="absolute inset-0 w-full h-full grid grid-cols-2 gap-[2px] md:gap-[4px] bg-black/10">
              <Link to={slide.link1 || slide.link} className="relative h-full w-full overflow-hidden block">
                <img
                  src={slide.image}
                  alt=""
                  className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
              </Link>
              <Link to={slide.link2 || slide.link} className="relative h-full w-full overflow-hidden block">
                <img
                  src={slide.image2}
                  alt=""
                  className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-[800ms] ease-out"
                />
              </Link>
            </div>
          ) : (
            // Standard single image background
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/hero_street.png';
              }}
            />
          )}

          {/* Ambient gradient to overlay text cleanly */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 flex h-full min-h-[600px] md:min-h-[750px] lg:min-h-[85vh] flex-col justify-center p-8 md:p-24 md:max-w-3xl text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-4 block italic">
              {slide.eyebrow}
            </span>
            <h1 className="font-sans text-5xl md:text-8xl font-black text-white leading-[0.9] italic tracking-tighter uppercase">
              {slide.title}
            </h1>
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.5em] text-brand-primary">
              {slide.subtitle}
            </p>
            <p className="mt-8 max-w-md text-sm text-white/70 leading-relaxed font-bold uppercase tracking-tight">
              {slide.description}
            </p>
            {slide.link.startsWith('#') ? (
              <a
                href={slide.link}
                className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-brand-primary px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all shadow-2xl shadow-brand-primary/20"
              >
                {slide.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                to={slide.link}
                className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-brand-primary px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all shadow-2xl shadow-brand-primary/20"
              >
                {slide.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-white/10 p-3 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-white/10 p-3 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 gap-3">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full relative overflow-hidden transition-all duration-500 ${
              i === index ? 'w-10 bg-white/25 shadow-lg shadow-brand-primary/5' : 'w-3 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === index && (
              <motion.div
                key={`${index}-${isPaused}`}
                initial={{ width: '0%' }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{
                  duration: isPaused ? 0 : 4,
                  ease: 'linear',
                }}
                className="absolute inset-y-0 left-0 bg-brand-primary"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
