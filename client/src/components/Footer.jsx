import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Camera, MessageSquare, Share2, Sparkles, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Logo } from './Logo.jsx';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Thank you for subscribing! Keep an eye on your inbox.');
    setNewsletterEmail('');
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
          <div className="flex items-center gap-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-surface-200 flex items-center justify-center text-app-text/40 hover:text-brand-primary hover:border-brand-primary transition-all">
              <Camera className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-surface-200 flex items-center justify-center text-app-text/40 hover:text-brand-primary hover:border-brand-primary transition-all">
              <MessageSquare className="h-4 w-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-surface-200 flex items-center justify-center text-app-text/40 hover:text-brand-primary hover:border-brand-primary transition-all">
              <Share2 className="h-4 w-4" />
            </a>
          </div>
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
        <div className="grid grid-cols-2 gap-6 lg:col-span-2">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Shop</h4>
            <ul className="space-y-2.5">
              <li><Link to="/shop" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Everything</Link></li>
              <li><Link to="/shop?sort=latest" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?badge=sale" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Sale & Offers</Link></li>
              <li><Link to="/shop?category=Footwear" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Footwear</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link to="/orders" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Track Orders</Link></li>
              <li><Link to="/wishlist" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">My Wishlist</Link></li>
              <li><Link to="/profile" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Account Details</Link></li>
              <li><Link to="/login" className="text-[13px] font-medium text-app-text/55 hover:text-brand-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-primary transition-colors shadow-inner"
              />
              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary/90 text-black px-4 rounded-xl transition-all shadow-md"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="space-y-3 pt-4 border-t border-surface-100/50">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
              <p className="text-sm text-app-text/55 font-medium">
                Design Studio, C-Scheme,<br />Jaipur, Rajasthan, 302001
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-brand-primary shrink-0" />
              <p className="text-sm text-app-text/55 font-medium">+91 141 2345678</p>
            </div>
          </div>

          <div className="pt-3 border-t border-surface-100/50 flex items-center gap-5">
            <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Privacy</Link>
            <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Terms</Link>
            <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-app-text/35 hover:text-brand-primary transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
