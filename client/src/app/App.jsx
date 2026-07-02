/** WHY: Main routing file. Defines all public and private pages (URLs). */
import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';

// Context Providers
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';
import { SocketProvider } from '../context/SocketContext.jsx';

// Component Layouts
import { Layout } from '../components/Layout.jsx';
import { AdminLayout } from '../components/AdminLayout.jsx';
import { AdminRoute } from '../components/AdminRoute.jsx';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';
import { PageLoader } from '../components/PageLoader.jsx';

// Pages (Lazy Loaded for Code Splitting)
const Home = lazy(() => import('../pages/Home.jsx').then(m => ({ default: m.Home })));
const Shop = lazy(() => import('../pages/Shop.jsx').then(m => ({ default: m.Shop })));
const StreetDrip = lazy(() => import('../pages/StreetDrip.jsx').then(m => ({ default: m.StreetDrip })));
const ProductDetails = lazy(() => import('../pages/ProductDetails.jsx').then(m => ({ default: m.ProductDetails })));
const Login = lazy(() => import('../pages/Login.jsx').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Register.jsx').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx').then(m => ({ default: m.ResetPassword })));
const Cart = lazy(() => import('../pages/Cart.jsx').then(m => ({ default: m.Cart })));
const Orders = lazy(() => import('../pages/Orders.jsx').then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('../pages/OrderDetail.jsx').then(m => ({ default: m.OrderDetail })));
const Profile = lazy(() => import('../pages/Profile.jsx').then(m => ({ default: m.Profile })));
const Wishlist = lazy(() => import('../pages/Wishlist.jsx').then(m => ({ default: m.Wishlist })));
const NotFound = lazy(() => import('../pages/NotFound.jsx').then(m => ({ default: m.NotFound })));
const AboutUs = lazy(() => import('../pages/AboutUs.jsx').then(m => ({ default: m.AboutUs })));
const VendorStore = lazy(() => import('../pages/VendorStore.jsx').then(m => ({ default: m.VendorStore })));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts.jsx').then(m => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories.jsx').then(m => ({ default: m.AdminCategories })));
const AdminSubcategories = lazy(() => import('../pages/admin/AdminSubcategories.jsx').then(m => ({ default: m.AdminSubcategories })));
const AdminCoupons = lazy(() => import('../pages/admin/AdminCoupons.jsx').then(m => ({ default: m.AdminCoupons })));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders.jsx').then(m => ({ default: m.AdminOrders })));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers.jsx').then(m => ({ default: m.AdminUsers })));
const AdminVendors = lazy(() => import('../pages/admin/AdminVendors.jsx').then(m => ({ default: m.AdminVendors })));
const AdminVendorProfile = lazy(() => import('../pages/admin/AdminVendorProfile.jsx').then(m => ({ default: m.AdminVendorProfile })));

// Seller Pages (Lazy Loaded)
import { SellerLayout } from '../components/SellerLayout.jsx';
import { SellerRoute } from '../components/SellerRoute.jsx';
const SellerDashboard = lazy(() => import('../pages/admin/SellerDashboard.jsx').then(m => ({ default: m.SellerDashboard })));
const SellerProducts = lazy(() => import('../pages/admin/SellerProducts.jsx').then(m => ({ default: m.SellerProducts })));
const AddEditProduct = lazy(() => import('../pages/admin/AddEditProduct.jsx'));
const SellerOrders = lazy(() => import('../pages/admin/SellerOrders.jsx').then(m => ({ default: m.SellerOrders })));
const SellerAffiliates = lazy(() => import('../pages/admin/SellerAffiliates.jsx').then(m => ({ default: m.SellerAffiliates })));
const SellerStorefront = lazy(() => import('../pages/admin/SellerStorefront.jsx').then(m => ({ default: m.SellerStorefront })));
const SellerBilling = lazy(() => import('../pages/admin/SellerBilling.jsx').then(m => ({ default: m.SellerBilling })));

import '../App.css';

// Scroll to top helper component on page transition
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <WishlistProvider>
                  {/* Global Toast Alert Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 1500,
                    className: 'font-sans text-xs font-bold uppercase tracking-wider shadow-2xl backdrop-blur-md',
                    style: {
                      borderRadius: '12px',
                      background: 'rgba(10, 10, 10, 0.85)',
                      color: '#fff',
                      border: '1px solid var(--color-brand-primary)',
                      padding: '12px 20px',
                    },
                    success: {
                      iconTheme: { primary: 'var(--color-brand-primary)', secondary: '#000' }
                    }
                  }}
                />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="shop" element={<Shop />} />
                      <Route path="street-drip" element={<StreetDrip />} />
                      <Route path="product/:id" element={<ProductDetails />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password/:token" element={<ResetPassword />} />
                      <Route path="cart" element={<Cart />} />
                      <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                      <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="about" element={<AboutUs />} />
                      <Route path="store/:slug" element={<VendorStore />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="products/new" element={<AddEditProduct />} />
                      <Route path="products/:id/edit" element={<AddEditProduct />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="subcategories" element={<AdminSubcategories />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="vendors" element={<AdminVendors />} />
                      <Route path="vendors/:id" element={<AdminVendorProfile />} />
                    </Route>

                    <Route
                      path="/seller"
                      element={
                        <SellerRoute>
                          <SellerLayout />
                        </SellerRoute>
                      }
                    >
                      <Route path="dashboard" element={<SellerDashboard />} />
                      <Route path="products" element={<SellerProducts />} />
                      <Route path="products/new" element={<AddEditProduct />} />
                      <Route path="products/:id/edit" element={<AddEditProduct />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="orders" element={<SellerOrders />} />
                      <Route path="affiliates" element={<SellerAffiliates />} />
                      <Route path="storefront" element={<SellerStorefront />} />
                      <Route path="billing" element={<SellerBilling />} />
                    </Route>
                  </Routes>
                </Suspense>
                </WishlistProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
