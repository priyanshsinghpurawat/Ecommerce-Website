import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Logo } from './Logo.jsx';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/v3/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (res.ok) {
        toast.success('Thank you for subscribing! Keep an eye on your inbox.');
        setNewsletterEmail('');
      } else {
        toast.error('Subscription failed. Please try again.');
      }
    } catch {
      toast.error('Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-surface-100 bg-surface-50/50 mt-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Brand Section */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 group relative">
            <Logo className="h-10 w-10 shrink-0 transform group-hover:-translate-y-[2px] group-hover:rotate-[2deg] transition-all duration-300" />
            <div className="flex items-baseline font-bebas text-[38px] tracking-wider leading-none select-none">
              <span className="text-app-text font-normal">MENS</span>
              <span className="text-brand-primary font-black ml-1">VIBE</span>
            </div>
          </Link>
          <p className="text-sm text-app-text/55 leading-relaxed max-w-xs font-medium">
            Premium streetwear, sportswear, and handcrafted footwear. Quality-obsessed, customer-driven.

          </p>
          <div className="pt-1">
            <p className="text-sm font-black uppercase text-brand-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Exclusive Offer
            </p>
            <p className="text-xs text-app-text/55 mt-1">First order? Use <span className="font-black text-app-text/80">WELCOME50</span> for ₹50 off</p>
          </div>
          <p className="text-[11px] text-app-text/35 pt-1">
            © {new Date().getFullYear()} <span className="font-bold text-app-text/60">MensVibe</span>. Crafted for the Modern Man.
          </p>
        </div>

        {/* Navigation */}
        <div className="lg:col-span-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">NEED HELP</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <li><Link to="/shop" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Footwear</Link></li>
            <li><Link to="/contact" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Contact Us</Link></li>
            <li><Link to="/about" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">About Us</Link></li>
            <li><Link to="/orders" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Track Order</Link></li>
            <li><Link to="/returns-policy" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Returns & Refunds</Link></li>
            <li><Link to="/terms/sale" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Sale Terms</Link></li>
            <li><Link to="/misc" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Miscellaneous</Link></li>
            <li><Link to="/membership" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Membership</Link></li>
            <li><Link to="/returns" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Exchange & Refund</Link></li>
            <li><Link to="/shipping" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Shipping & Tracking</Link></li>
            <li><Link to="/orders-payment-faq" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Orders & Payment</Link></li>
            <li><Link to="/privacy" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Newsletter & Contact */}
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Newsletter</h4>
            <p className="text-sm text-app-text/55 mb-3 font-medium">Subscribe to get updates on weekly drops and offers.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-brand-primary hover:bg-brand-primary/90 text-black px-4 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {subscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
       

          <div className="pt-3 border-t border-surface-100/50 flex items-center gap-5">
            <Link to="/privacy" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Terms</Link>
            <Link to="/shipping" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
