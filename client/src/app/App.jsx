/**
 * Root component: providers (Auth, Cart, …) + React Router routes.
 * Storefront routes use Layout; admin uses AdminLayout + AdminRoute.
 */
import React from 'react';
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

// Pages
import { Home } from '../pages/Home.jsx';
import { Shop } from '../pages/Shop.jsx';
import { StreetDrip } from '../pages/StreetDrip.jsx';
import { ProductDetails } from '../pages/ProductDetails.jsx';
import { Login } from '../pages/Login.jsx';
import { Register } from '../pages/Register.jsx';
import { Cart } from '../pages/Cart.jsx';
import { Orders } from '../pages/Orders.jsx';
import { OrderDetail } from '../pages/OrderDetail.jsx';
import { Profile } from '../pages/Profile.jsx';
import { Wishlist } from '../pages/Wishlist.jsx';
import { NotFound } from '../pages/NotFound.jsx';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard.jsx';
import { AdminProducts } from '../pages/admin/AdminProducts.jsx';
import { AdminCategories } from '../pages/admin/AdminCategories.jsx';
import { AdminSubcategories } from '../pages/admin/AdminSubcategories.jsx';
import { AdminCoupons } from '../pages/admin/AdminCoupons.jsx';
import { AdminOrders } from '../pages/admin/AdminOrders.jsx';
import { AdminUsers } from '../pages/admin/AdminUsers.jsx';
import { AdminVendors } from '../pages/admin/AdminVendors.jsx';
import { AdminVendorProfile } from '../pages/admin/AdminVendorProfile.jsx';

// Seller Pages
import { SellerLayout } from '../components/SellerLayout.jsx';
import { SellerRoute } from '../components/SellerRoute.jsx';
import { SellerDashboard } from '../pages/admin/SellerDashboard.jsx';
import { SellerProducts } from '../pages/admin/SellerProducts.jsx';
import AddEditProduct from '../pages/admin/AddEditProduct.jsx';
import { SellerOrders } from '../pages/admin/SellerOrders.jsx';

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
