import React from 'react';
import { motion } from 'framer-motion';
import { Ruler, Scissors, Sparkles, MoveRight, Layers, ShieldCheck } from 'lucide-react';
import { SEO } from '../components/SEO.jsx';

export const AboutUs = () => {
  return (
    <div className="min-h-screen bg-app-bg text-app-text pt-24 pb-16">
      <SEO title="About Us" description="Learn about MensVibe — premium streetwear brand for men." />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-6">
              Redefining the <span className="text-brand-primary italic">Flow</span> of Fashion.
            </h1>
            <p className="text-sm md:text-base text-app-text/70 leading-relaxed max-w-2xl mx-auto font-medium">
              We believe Gen-Z style should be a right, not a size-restricted privilege. 
              Mensvibe is the intersection where perfect fit meets modern culture.
            </p>
          </motion.div>
        </div>

        {/* Problem vs Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-surface-50 border border-surface-200 shadow-soft"
          >
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
              <Scissors className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4">The Problem</h2>
            <p className="text-sm text-app-text/60 leading-relaxed">
              Mainstream fashion forces a compromise. Individuals with unique body types—especially tall frames needing 188cm to 195cm tailored inseams—are left out of the fast-paced trend cycle. Add in notoriously inconsistent shoe sizing and instant sell-outs, and finding clothes that actually fit your identity becomes a struggle.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-brand-primary/5 border border-brand-primary/20 shadow-soft"
          >
            <div className="h-12 w-12 rounded-2xl gradient-primary text-black flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 text-brand-primary">The Mensvibe Solution</h2>
            <p className="text-sm text-app-text/70 leading-relaxed">
              We engineer trend-forward aesthetics with dedicated architectural categories for every body type. From guaranteed extended lengths for taller figures to flexible, highly-available footwear sizing, we ensure that your personal style never has to compromise on comfort, drape, or availability.
            </p>
          </motion.div>
        </div>

        {/* The Bulletproof Edge */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Our Competitive Edge</h3>
            <p className="text-xs text-app-text/50 font-medium">Why we stand out in the crowded Gen-Z fashion market.</p>
          </div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl border border-surface-100 bg-surface-50/50 hover:border-brand-primary/30 transition-all group"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-200 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-colors">
                <Ruler className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Architected For Height</h4>
                <p className="text-xs text-app-text/60 leading-relaxed">
                  Unlike fast-fashion brands that treat tall sizing as an afterthought, or niche tall-brands that lack modern aesthetics, we natively build our silhouettes for 6'2" - 6'5" (188cm-195cm) frames. We preserve the signature Gen-Z 'drape' and baggy flow without awkward ankle-crops.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl border border-surface-100 bg-surface-50/50 hover:border-brand-primary/30 transition-all group"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-200 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-colors">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Footwear Inclusivity</h4>
                <p className="text-xs text-app-text/60 leading-relaxed">
                  We understand the frustration of finding a size 11 out of stock and settling for a 10.5. Our footwear sourcing strategy prioritizes deep inventory on crucial half-sizes and wider toe-boxes, ensuring your fit isn't dictated by scarcity culture.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-2xl border border-surface-100 bg-surface-50/50 hover:border-brand-primary/30 transition-all group"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-200 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-2">Bulletproof Quality</h4>
                <p className="text-xs text-app-text/60 leading-relaxed">
                  We don't get stuck in our own problems; we solve them systematically. From hyper-tested fabrics to meticulously calibrated size charts, everything is designed to be reliable, transparent, and built to last.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};
