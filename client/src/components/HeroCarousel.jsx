import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from '../constants/showcase.js';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDE_DURATION = 6000;

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION);
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

  const renderImage = (src, className = '') => (
    <img
      src={src}
      alt="Hero banner"
      loading={index === 0 ? 'eager' : 'lazy'}
      onError={(e) => { e.target.onerror = null; e.target.src = '/assets/hero_street.png'; }}
      className={className}
    />
  );

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-black min-h-[50vh] md:min-h-[70vh] lg:min-h-[85vh] group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {slide.image3 ? (
            <div className="absolute inset-0 w-full h-full grid grid-cols-3 gap-0">
              {[slide.image, slide.image2, slide.image3].map((img, i) => (
                <Link key={i} to={[slide.link1, slide.link2, slide.link3][i] || slide.link} className="relative h-full w-full overflow-hidden block">
                  <img
                    src={img}
                    alt={slide.title || 'Hero slide'}
                    className="w-full h-full object-cover object-top"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <img
              src={slide.image}
              alt={slide.title || 'Hero slide'}
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/hero_street.png'; }}
            />
          )}

          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient || 'from-black/80 via-black/40 to-transparent'}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div       className="relative z-20 flex h-[50vh] md:h-[70vh] lg:h-[85vh] flex-col justify-end md:justify-center p-6 md:p-16 lg:p-24 md:max-w-4xl text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-primary mb-4 block"
            >
              {slide.eyebrow}
            </motion.span>
            <h1 className="font-sans text-6xl md:text-[100px] lg:text-[120px] font-black text-white leading-[0.85] tracking-tighter uppercase">
              {slide.title}
            </h1>
            <p className="mt-3 md:mt-5 text-xs md:text-sm font-black uppercase tracking-[0.6em] text-white/50">
              {slide.subtitle}
            </p>
            <p className="mt-6 md:mt-8 max-w-md text-sm md:text-base text-white/60 leading-relaxed font-medium">
              {slide.description}
            </p>
            <Link
              to={slide.link}
              className="mt-8 md:mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-brand-primary px-8 md:px-12 py-3.5 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 hover:shadow-[0_0_40px_rgba(193,255,0,0.3)] transition-all duration-300"
            >
              {slide.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/10 p-2.5 md:p-3 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/10 p-2.5 md:p-3 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 border border-white/10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <div className="absolute bottom-6 md:bottom-10 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:gap-3">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full relative overflow-hidden transition-all duration-500 ${
              i === index ? 'w-10 bg-white/25' : 'w-3 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === index && (
              <motion.div
                key={`${index}-${isPaused}`}
                initial={{ width: '0%' }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{ duration: isPaused ? 0 : SLIDE_DURATION / 1000, ease: 'linear' }}
                className="absolute inset-y-0 left-0 bg-brand-primary"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
