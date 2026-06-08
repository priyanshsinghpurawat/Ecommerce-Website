import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-lux-bg font-sans text-lux-dark antialiased">
      <Navbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 md:py-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};
