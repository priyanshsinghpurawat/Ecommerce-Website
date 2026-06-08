import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from '../constants/showcase.js';

export const HeroCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[index];

  return (
    <section className="relative w-full overflow-hidden rounded-[2rem] md:rounded-[3.5rem] bg-lux-bg min-h-[600px] md:min-h-[750px] lg:min-h-[85vh] shadow-soft mx-auto max-w-full group">
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={s.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/hero_street.png';
            }}
            className="absolute inset-0 h-full w-full object-cover object-center md:object-top"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
        </div>
      ))}

      <div className="relative z-20 flex h-full min-h-[600px] md:min-h-[750px] lg:min-h-[85vh] flex-col justify-center p-8 md:p-24 md:max-w-3xl text-left">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-4 italic">
          {slide.eyebrow}
        </span>
        <h1 className="font-sans text-5xl md:text-8xl font-black text-white leading-[0.9] italic tracking-tighter uppercase">
          {slide.title}
        </h1>
        <p className="mt-4 text-[11px] font-black uppercase tracking-[0.5em] text-lux-primary">
          {slide.subtitle}
        </p>
        <p className="mt-8 max-w-md text-sm text-white/70 leading-relaxed font-bold uppercase tracking-tight">
          {slide.description}
        </p>
        <Link
          to={slide.link}
          className="mt-10 inline-flex w-fit items-center gap-3 rounded-full bg-lux-primary px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all shadow-2xl shadow-lux-primary/20"
        >
          {slide.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-white/10 p-3 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 border border-white/10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % HERO_SLIDES.length)}
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
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-10 bg-lux-primary shadow-lg shadow-lux-primary/50' : 'w-3 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
