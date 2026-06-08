/**
 * Root component: providers (Auth, Cart, …) + React Router routes.
 * Storefront routes use Layout; admin uses AdminLayout + AdminRoute.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from '../context/AuthContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { ProductProvider } from '../context/ProductContext.jsx';
import { CategoryProvider } from '../context/CategoryContext.jsx';
import { WishlistProvider } from '../context/WishlistContext.jsx';

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
const Cart = lazy(() => import('../pages/Cart.jsx').then(m => ({ default: m.Cart })));
const Orders = lazy(() => import('../pages/Orders.jsx').then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('../pages/OrderDetail.jsx').then(m => ({ default: m.OrderDetail })));
const Profile = lazy(() => import('../pages/Profile.jsx').then(m => ({ default: m.Profile })));
const Wishlist = lazy(() => import('../pages/Wishlist.jsx').then(m => ({ default: m.Wishlist })));
const NotFound = lazy(() => import('../pages/NotFound.jsx').then(m => ({ default: m.NotFound })));

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

import '../App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <CategoryProvider>
              <CartProvider>
                <WishlistProvider>
                {/* Global Toast Alert Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: 'font-sans text-sm border border-lux-200 shadow-xl',
                    style: {
                      borderRadius: '12px',
                      background: 'var(--color-lux-card)',
                      color: 'var(--color-lux-dark)',
                    },
                  }}
                />

                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    
                    {/* Public Storefront Layout */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="shop" element={<Shop />} />
                      <Route path="street-drip" element={<StreetDrip />} />
                      <Route path="product/:id" element={<ProductDetails />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                      <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                      <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* Secure Admin Control Layout */}
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

                    {/* Seller Panel Layout */}
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
                      <Route path="orders" element={<SellerOrders />} />
                    </Route>

                  </Routes>
                </Suspense>
              </WishlistProvider>
            </CartProvider>
          </CategoryProvider>
        </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}

export default App;
