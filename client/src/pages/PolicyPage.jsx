import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { SEO } from '../components/SEO.jsx';
import { 
  Shield, 
  FileText, 
  Truck, 
  RotateCcw, 
  HelpCircle, 
  Mail, 
  UserCheck, 
  CreditCard, 
  Sliders, 
  Send 
} from 'lucide-react';

export const PolicyPage = () => {
  const location = useLocation();
  const path = location.pathname;

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    toast.success('Thank you! Your message has been sent successfully. We will get back to you within 24 hours.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  // Content Configuration mapping by path
  const getContent = () => {
    switch (path) {
      case '/privacy':
        return {
          title: 'Privacy Policy',
          icon: <Shield className="h-10 w-10 text-brand-primary" />,
          subtitle: 'How we collect, use, and safeguard your data.',
          seoTitle: 'Privacy Policy - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Information We Collect</h3>
                <p>We collect information you provide directly to us when creating an account, making a purchase, subscribing to our newsletter, or contacting support. This includes your name, email, billing address, shipping address, and payment information.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. How We Use Your Data</h3>
                <p>We use your information to process transactions, manage accounts, ship orders, improve platform experience, and communicate updates, promotional offers, and security alerts.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. Cookies and Tracking</h3>
                <p>We use cookies and similar technologies to remember cart contents, verify user sessions, analyze site traffic, and deliver personalized recommendations.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">4. Data Sharing and Protection</h3>
                <p>Your personal data is encrypted and transmitted securely. We do not sell or rent your information. We only share data with essential third-party processors, such as shipping partners and payment gateways, to complete orders.</p>
              </section>
            </div>
          )
        };

      case '/terms':
        return {
          title: 'Terms of Service',
          icon: <FileText className="h-10 w-10 text-brand-primary" />,
          subtitle: 'The rules, guidelines, and terms governing your use of MensVibe.',
          seoTitle: 'Terms of Service - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Agreement to Terms</h3>
                <p>By accessing or using the MensVibe website, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of these terms, you must not use our site.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. Account Responsibility</h3>
                <p>If you create an account, you are solely responsible for maintaining credentials confidentiality and monitoring all activities occurring under your account.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. Intellectual Property</h3>
                <p>All content on MensVibe—including text, graphics, designs, logos, and product catalog code—is the property of MensVibe and is protected by copyright, trademark, and intellectual property laws.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">4. Liability Limitation</h3>
                <p>MensVibe is provided "as is" without warranty. We do not guarantee uninterrupted access or error-free operations. We are not liable for direct or indirect damages resulting from platform misuse.</p>
              </section>
            </div>
          )
        };

      case '/shipping':
      case '/shipping-tracking':
        return {
          title: 'Shipping & Tracking',
          icon: <Truck className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Detailed timelines, options, and tracking details.',
          seoTitle: 'Shipping & Tracking - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Shipping Options & Costs</h3>
                <p>We offer standard and express shipping option layers. Standard shipping is complimentary on all prepaid orders within India. Express shipping options are calculated during checkout based on weight and destination.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. Processing & Dispatch Timelines</h3>
                <p>Pre-orders and design drops usually dispatch within 48 hours of order placement. Standard delivery takes 3 to 6 business days, while express delivery takes 1 to 3 business days.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. Order Tracking</h3>
                <p>Once dispatched, you will receive a tracking link via email and WhatsApp. You can also view live status updates directly within the <Link to="/orders" className="text-brand-primary font-bold hover:underline">Track Orders</Link> dashboard after logging in.</p>
              </section>
            </div>
          )
        };

      case '/returns':
      case '/returns-policy':
        return {
          title: 'Returns & Exchange',
          icon: <RotateCcw className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Hassle-free 7-day return and exchange rules.',
          seoTitle: 'Returns & Exchange Policy - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Return Eligibility Window</h3>
                <p>We offer a strict 7-day return or exchange window from the date of package delivery. Items must be unworn, unwashed, and possess original price tags intact with safety seals attached.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. Free Reverse Pickup</h3>
                <p>We organize complimentary reverse pickup services from your home address. If your postal code is not covered, we request self-shipment and will refund shipping expenses as store credits.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. Refund Processing Time</h3>
                <p>Once reverse transit products are checked by our quality team, refunds are issued immediately to your bank account for prepaid purchases, or as store credits for Cash on Delivery (COD) orders, processing in 3-5 business days.</p>
              </section>
            </div>
          )
        };

      case '/terms/sale':
        return {
          title: 'Sale Terms & Conditions',
          icon: <FileText className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Specific guidelines for promotions, flash sales, and seasonal events.',
          seoTitle: 'Sale Terms - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Limited Availability</h3>
                <p>Sale items are available on a first-come, first-served basis. Adding items to a shopping cart does not reserve inventory, which is finalized only upon payment confirmation.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. Promo Codes and Offers</h3>
                <p>Promotional codes cannot be combined with existing clearance sale markdowns unless stated otherwise. Coupons apply to specific collections only.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. No Modifications</h3>
                <p>Orders placed during flash sales are processed instantly to guarantee fast dispatch times, meaning modifications or address corrections cannot be guaranteed post-checkout.</p>
              </section>
            </div>
          )
        };

      case '/membership':
        return {
          title: 'Exclusive Membership',
          icon: <UserCheck className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Access the inner circle of streetwear Drops, Sales, and VIP benefits.',
          seoTitle: 'Exclusive Membership - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">1. Priority Early Access</h3>
                <p>Members gain early access to all limited-edition drops, catalog pre-orders, and secret warehouse clearance sales 24 hours before public release.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">2. Point Loyalty Accruals</h3>
                <p>Earn 1 point for every ₹10 spent. Points can be redeemed for direct cash discounts, free shipping upgrades, and members-only custom merchandise.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">3. Join Today</h3>
                <p>Membership is complimentary. Simply register an account or log in to automatically start tracking loyalty drops.</p>
              </section>
            </div>
          )
        };

      case '/orders-payment-faq':
        return {
          title: 'Orders & Payment FAQ',
          icon: <CreditCard className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Payment methods, security transactions, and orders verification.',
          seoTitle: 'Orders & Payment FAQ - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">What payment options do you support?</h3>
                <p>We support Credit/Debit cards (Visa, MasterCard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking, and secure Cash on Delivery (COD) options.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">Is transaction processing secure?</h3>
                <p>Yes. All payments are encrypted using bank-grade secure socket layer certificates. We do not store credit card credentials on our servers.</p>
              </section>
              <section>
                <h3 className="text-base font-bold text-app-text uppercase mb-2">Why was my payment declined?</h3>
                <p>Common reasons include insufficient limit levels, invalid OTP entry, or bank server timeouts. If debited without confirmation, the funds will return to source within 48 hours.</p>
              </section>
            </div>
          )
        };

      case '/contact':
        return {
          title: 'Contact Us',
          icon: <Mail className="h-10 w-10 text-brand-primary" />,
          subtitle: 'Got questions? Reach out to support. We are here to help.',
          seoTitle: 'Contact Support - MensVibe',
          body: (
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-app-text/50 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-surface-200 bg-surface-50 text-app-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-app-text/50 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-surface-200 bg-surface-50 text-app-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-app-text/50 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-surface-200 bg-surface-50 text-app-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium"
                  placeholder="Subject of inquiry"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-app-text/50 mb-1.5">Message *</label>
                <textarea
                  rows="5"
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-surface-200 bg-surface-50 text-app-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-medium resize-none"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-primary/95 text-black font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Send className="h-4 w-4" /> Send Message
              </button>
            </form>
          )
        };

      default:
        return {
          title: 'Miscellaneous Info',
          icon: <Sliders className="h-10 w-10 text-brand-primary" />,
          subtitle: 'General platform guides and support directory.',
          seoTitle: 'Support - MensVibe',
          body: (
            <div className="space-y-6 text-sm text-app-text/75 leading-relaxed">
              <p>Welcome to our support directory. Use the sidebar/tabs navigation link tags to browse terms, refund processes, order tracking, and store policies.</p>
              <p>For urgent inquiries, please submit a request through the <Link to="/contact" className="text-brand-primary font-bold hover:underline">Contact Us</Link> portal or call support at +91 141 2345678.</p>
            </div>
          )
        };
    }
  };

  const current = getContent();

  const sidebarLinks = [
    { name: 'Contact Us', path: '/contact', icon: <Mail className="h-4 w-4" /> },
    { name: 'Track Order', path: '/orders', icon: <Truck className="h-4 w-4" /> },
    { name: 'Returns & Refunds', path: '/returns-policy', icon: <RotateCcw className="h-4 w-4" /> },
    { name: 'Sale Terms', path: '/terms/sale', icon: <FileText className="h-4 w-4" /> },
    { name: 'Membership', path: '/membership', icon: <UserCheck className="h-4 w-4" /> },
    { name: 'Privacy Policy', path: '/privacy', icon: <Shield className="h-4 w-4" /> },
    { name: 'Terms of Service', path: '/terms', icon: <FileText className="h-4 w-4" /> },
    { name: 'Shipping Guide', path: '/shipping', icon: <Truck className="h-4 w-4" /> },
    { name: 'FAQ & Payments', path: '/orders-payment-faq', icon: <HelpCircle className="h-4 w-4" /> },
    { name: 'Miscellaneous', path: '/misc', icon: <Sliders className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-app-text pt-24 pb-16">
      <SEO title={current.seoTitle} description={current.subtitle} />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
              {current.icon}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
              {current.title}
            </h1>
            <p className="text-xs md:text-sm text-app-text/65 font-medium max-w-xl">
              {current.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Support / Policies Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary px-3 mb-3">Support Index</h3>
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 scrollbar-none">
              {sidebarLinks.map((link) => {
                const isActive = path === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                      isActive 
                        ? 'bg-brand-primary text-black border-brand-primary' 
                        : 'bg-surface-50/50 text-app-text/60 border-surface-100 hover:text-brand-primary hover:border-brand-primary/30'
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Policy Text & Forms Display Card */}
          <motion.div 
            key={path}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3 p-6 md:p-10 rounded-3xl bg-surface-50 border border-surface-200 shadow-soft"
          >
            {current.body}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
