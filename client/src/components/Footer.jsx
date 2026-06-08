import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Camera, MessageSquare, Share2, Sparkles, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
    <footer className="border-t border-lux-100 bg-lux-50/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand Section */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-black text-black transition-transform group-hover:scale-110">
              M
            </span>
            <span className="text-xl font-black tracking-tighter text-lux-dark uppercase italic">
              Mens<span className="text-lux-primary">Vibe</span>
            </span>
          </Link>
          <p className="text-xs text-lux-dark/60 leading-relaxed max-w-xs">
            Redefining men's style with a curated collection of premium streetwear, sportswear, and handcrafted footwear.
            Quality-obsessed, customer-driven.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-lux-200 flex items-center justify-center text-lux-dark/40 hover:text-lux-primary hover:border-lux-primary transition-all">
              <Camera className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-lux-200 flex items-center justify-center text-lux-dark/40 hover:text-lux-primary hover:border-lux-primary transition-all">
              <MessageSquare className="h-4 w-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full border border-lux-200 flex items-center justify-center text-lux-dark/40 hover:text-lux-primary hover:border-lux-primary transition-all">
              <Share2 className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-8 lg:col-span-2">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-lux-dark mb-6">Shop Catalog</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Everything</Link></li>
              <li><Link to="/shop?sort=latest" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?badge=sale" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Sale & Offers</Link></li>
              <li><Link to="/shop?category=Footwear" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Footwear</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-lux-dark mb-6">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/orders" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Track Orders</Link></li>
              <li><Link to="/wishlist" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">My Wishlist</Link></li>
              <li><Link to="/profile" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Account Details</Link></li>
              <li><Link to="/login" className="text-xs text-lux-dark/50 hover:text-lux-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter & Contact */}
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-lux-dark mb-4">Newsletter</h4>
            <p className="text-xs text-lux-dark/60 mb-3">Subscribe to get updates on weekly drops and offers.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-lux-200 bg-white focus:outline-none focus:border-lux-primary transition-colors"
              />
              <button
                type="submit"
                className="bg-lux-dark hover:bg-lux-primary hover:text-black text-white p-2 rounded-xl transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="space-y-3 pt-4 border-t border-lux-100/50">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-lux-primary shrink-0 mt-0.5" />
              <p className="text-xs text-lux-dark/60 leading-tight">
                Design Studio, C-Scheme,<br />Jaipur, Rajasthan, 302001
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-lux-primary shrink-0" />
              <p className="text-xs text-lux-dark/60">+91 141 2345678</p>
            </div>
          </div>

          <div className="pt-3 border-t border-lux-100/50">
            <p className="text-[9px] font-bold uppercase text-emerald-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Exclusive Offer
            </p>
            <p className="text-[11px] text-lux-dark/40 italic">Use code <span className="text-lux-dark font-bold not-italic">MENSVIBE10</span> for 10% off</p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-lux-100/50 py-8 bg-lux-50/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-lux-dark/40 font-medium">
            © {new Date().getFullYear()} <span className="font-bold text-lux-dark/60">MensVibe</span>. Crafted for the Modern Man.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-[9px] font-bold uppercase tracking-tighter text-lux-dark/30 hover:text-lux-dark transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-[9px] font-bold uppercase tracking-tighter text-lux-dark/30 hover:text-lux-dark transition-colors">Terms of Service</Link>
            <Link to="#" className="text-[9px] font-bold uppercase tracking-tighter text-lux-dark/30 hover:text-lux-dark transition-colors">Shipping Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
