import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { SEO } from '../components/SEO.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  CreditCard, 
  Loader2,
  Lock,
  Tag,
  Ticket,
  X
} from 'lucide-react';
import { FrequentlyBoughtTogether } from '../components/FrequentlyBoughtTogether.jsx';
import { toast } from 'react-hot-toast';
import { 
  createCheckout,
  verifyPayment,
  getPaymentConfig,
} from '../services/payment.service.js';
import { createOrder } from '../services/order.service.js';
import { applyCoupon } from '../services/coupon.service.js';
import { getProfile } from '../services/user.service.js';
import { resolveImageUrl, validateIndianPhone, getErrorMessage } from '../utils/helpers.js';
import { DEFAULT_SHIPPING, SUGGESTED_COUPONS } from '../constants/checkout.js';

// Hoisted motion variants
const EMPTY_CART_ANIMATION = { opacity: 1, y: 0 };
const EMPTY_CART_INITIAL = { opacity: 0, y: 15 };
const ITEM_EXIT = { opacity: 0, x: -100 };
const SHIPPING_ANIMATION = { opacity: 1, y: 0 };
const SHIPPING_INITIAL = { opacity: 0, y: 16 };

export const Cart = () => {
  const { 
    cart, 
    cartTotal, 
    cartItemsCount, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    clearLocalCart
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0.18);
  const [shipping, setShipping] = useState({ ...DEFAULT_SHIPPING });

  // State to track which item is currently being updated to render loaders
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const shippingFields = useMemo(() => [
    { key: 'fullName', label: 'Full name', type: 'text' },
    { key: 'phone', label: 'Phone (10 digits)', type: 'tel', maxLength: 10 },
    { key: 'street', label: 'Street address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'PIN code', type: 'text', maxLength: 6 }
  ], []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const initCart = async () => {
      try {
        const [profileRes, configRes] = await Promise.all([
          getProfile(),
          getPaymentConfig()
        ]);
        
        if (profileRes?.success) {
          const u = profileRes.data;
          const defaultAddr = u.addresses?.find(a => a.isDefault) || u.addresses?.[0];
          setShipping((prev) => ({
            ...prev,
            fullName: u.name?.trim() || prev.fullName,
            phone: u.phone?.trim() || prev.phone,
            street: defaultAddr?.street?.trim() || prev.street,
            city: defaultAddr?.city?.trim() || prev.city,
            state: defaultAddr?.state?.trim() || prev.state,
            zipCode: defaultAddr?.zipCode?.trim() || prev.zipCode,
            country: defaultAddr?.country?.trim() || prev.country
          }));
        }
        
        setRazorpayEnabled(Boolean(configRes?.data?.razorpayEnabled));
        if (configRes?.data?.taxRate != null) setTaxRate(configRes.data.taxRate);
      } catch (err) {
        console.error('Cart initialization failed:', err);
      }
    };
    
    initCart();
  }, [isAuthenticated]);

  const handleQuantityChange = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    
    setUpdatingItemId(itemId);
    const res = await updateQuantity(itemId, newQty);
    setUpdatingItemId(null);
    if (!res.success) {
      toast.error(res.error || 'Failed to update quantity.');
    }
  };

  const handleRemove = async (itemId) => {
    const res = await removeFromCart(itemId);
    if (res.success) {
      toast.success('Item removed from cart.');
    } else {
      toast.error(res.error || 'Failed to remove item.');
    }
  };

  const buildShippingPayload = () => {
    const phoneCheck = validateIndianPhone(shipping.phone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.message);
      return null;
    }
    setPhoneError('');
    return {
      ...shipping,
      fullName: shipping.fullName.trim(),
      phone: phoneCheck.digits,
      street: shipping.street.trim(),
      city: shipping.city.trim(),
      state: shipping.state.trim(),
      zipCode: shipping.zipCode.trim(),
      country: shipping.country?.trim() || 'India'
    };
  };

  const validateShippingForm = () => {
    const required = ['fullName', 'phone', 'street', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shipping[field]?.trim()) {
        toast.error('Please complete all shipping fields.');
        return false;
      }
    }
    const phoneCheck = validateIndianPhone(shipping.phone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.message);
      toast.error(phoneCheck.message);
      return false;
    }
    setPhoneError('');
    if (!/^\d{6}$/.test(shipping.zipCode.trim())) {
      toast.error('PIN code must be 6 digits.');
      return false;
    }
    return true;
  };

  const handlePlaceCodOrder = async () => {
    const payload = buildShippingPayload();
    if (!payload) return;

    setCheckoutLoading(true);
    try {
      const res = await createOrder({
        shippingAddress: payload,
        couponCode: appliedCoupon?.code,
        paymentMethod: 'cod',
        taxAmount: billData.gstAmount
      });
      if (res?.success) {
        toast.success('Order placed! Pay when your delivery arrives.');
        clearLocalCart();
        navigate(`/orders/${res.data._id}`);
      } else {
        toast.error(res?.message || 'Could not place order.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not place order.'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    const payload = buildShippingPayload();
    if (!payload) return;

    if (!window.Razorpay) {
      toast.error('Payment SDK not loaded. Refresh the page.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await createCheckout({
        shippingAddress: payload,
        couponCode: appliedCoupon?.code,
        taxAmount: billData.gstAmount
      });
      
      if (!res?.success || !res.data) {
        toast.error(res?.message || 'Could not start online payment.');
        setCheckoutLoading(false);
        return;
      }

      const pay = res.data;
      const options = {
        key: pay.keyId,
        amount: pay.amountPaise,
        currency: 'INR',
        name: 'MensVibe',
        description: `Order ${pay.orderNumber}`,
        image: 'https://mensvibe.in/logo.png', // Fallback logo
        order_id: pay.razorpayOrderId,
        handler: async (response) => {
          setCheckoutLoading(true);
          try {
            const verified = await verifyPayment({
              orderId: pay.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verified?.success) {
              toast.success('Payment verified! Order confirmed.');
              clearLocalCart();
              navigate(`/orders/${pay.orderId}`);
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(getErrorMessage(err, 'Payment verification failed.'));
          } finally {
            setCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
            toast.error('Payment cancelled.');
          }
        },
        prefill: {
          name: payload.fullName,
          contact: payload.phone
        },
        theme: { color: '#c1ff00' } // Acid Green
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setCheckoutLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      toast.error(getErrorMessage(err, 'Online checkout failed.'));
      setCheckoutLoading(false);
    }
  };

  const handleProceedCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    if (!showCheckout) {
      setShowCheckout(true);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
      return;
    }
    if (!validateShippingForm()) return;
    handlePlaceCodOrder();
  };

  const applySuggestedCoupon = async (code) => {
    const trimmed = code?.trim().toUpperCase();
    if (!trimmed) return;
    if (appliedCoupon?.code === trimmed) return;

    setApplyingCoupon(true);
    setCouponError('');
    try {
      const response = await applyCoupon(trimmed, cartTotal, cart.items);
      if (response?.success) {
        setAppliedCoupon(response.data);
        setCouponInput('');
        toast.success(`Coupon "${response.data.code}" applied!`);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'This coupon cannot be applied.');
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.success('Coupon removed.');
  };

  const couponDebounceRef = useRef(null);

  useEffect(() => {
    if (appliedCoupon) {
      if (cartItemsCount === 0 || cartTotal === 0) {
        setAppliedCoupon(null);
        return;
      }

      if (couponDebounceRef.current) clearTimeout(couponDebounceRef.current);

      couponDebounceRef.current = setTimeout(async () => {
        try {
          const response = await applyCoupon(appliedCoupon.code, cartTotal, cart.items);
          if (response && response.success) {
            setAppliedCoupon(response.data);
          }
        } catch (err) {
          setAppliedCoupon(null);
          const msg = err.response?.data?.message || 'Coupon removed due to updated cart total.';
          toast.error(msg);
        }
      }, 600);
    }

    return () => {
      if (couponDebounceRef.current) clearTimeout(couponDebounceRef.current);
    };
  }, [cartTotal, cartItemsCount]);

  const billData = useMemo(() => {
    const baseAmount = appliedCoupon ? appliedCoupon.finalTotal : cartTotal;
    const gstAmount = baseAmount * taxRate;
    const grandTotal = baseAmount + gstAmount;
    return { baseAmount, gstAmount, grandTotal };
  }, [cartTotal, appliedCoupon, taxRate]);

  if (!isAuthenticated && !cart?.items?.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 bg-surface-50 rounded-full flex items-center justify-center text-app-text/45 mb-4 shadow-soft">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-app-text mb-2">Your bag is empty</h2>
        <p className="text-sm text-app-text/55 max-w-sm mb-6 leading-relaxed">
          Add some items to get started.
        </p>
        <Link 
          to="/shop"
          className="rounded-2xl bg-app-text px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-app-text-hover shadow-lg shadow-app-text/20 transition-all duration-300"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <SEO title="Shopping Cart" description="Review your items before checkout." noindex />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-app-text">Your bag</h1>
          <p className="text-xs font-bold text-app-text/40 uppercase tracking-widest">Review items before checkout.</p>
        </div>
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-app-text/50 hover:text-brand-primary transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      {loading && !cart ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
        </div>
      ) : cartItemsCount === 0 ? (
        <motion.div
          initial={EMPTY_CART_INITIAL}
          animate={EMPTY_CART_ANIMATION}
          className="rounded-3xl border border-dashed border-surface-200 bg-surface-50/20 py-20 px-8 flex flex-col items-center justify-center text-center shadow-soft backdrop-blur-md min-h-[420px] gap-5"
        >
          <div className="h-16 w-16 bg-surface-50 rounded-full flex items-center justify-center text-app-text/45 mb-2 shadow-soft">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-app-text">Your bag is empty</h2>
            <p className="text-xs text-app-text/40 mt-1.5 font-medium max-w-xs">Nothing in here yet. Go find something that speaks to you.</p>
          </div>
          <Link
            to="/shop"
            className="rounded-full bg-brand-primary px-10 py-3.5 font-sans text-xs font-black uppercase tracking-widest text-black hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer active:scale-95"
          >
            Start Shopping
          </Link>
          <Link to="/shop?sort=latest" className="text-xs font-bold uppercase text-app-text/40 hover:text-brand-primary tracking-wider transition-colors">
            See new arrivals →
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Table Container */}
            <div className="lg:col-span-2 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface-50/40 shadow-soft backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50/30 text-xs font-black uppercase tracking-wider text-app-text/50">
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4 text-center">Quantity</th>
                        <th className="px-6 py-4 text-right">Unit Price</th>
                        <th className="px-6 py-4 text-right">Subtotal</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100/40 text-xs font-bold text-app-text">
                      <AnimatePresence initial={false}>
                        {cart.items.map((item) => {
                          const prod = item.product;
                          if (!prod) return null;

                          const hasDiscount = prod.discountedPrice !== null && prod.discountedPrice !== undefined;
                          const unitPrice = hasDiscount ? prod.discountedPrice : prod.price;
                          const itemSubtotal = unitPrice * item.quantity;

                          return (
                            <motion.tr 
                              key={item._id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={ITEM_EXIT}
                              transition={{ duration: 0.3 }}
                              className="hover:bg-surface-50/20 transition-all align-middle"
                            >
                              {/* Product Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <Link to={`/product/${prod.slug || prod._id}`} className="block w-[60px] h-[60px] flex-shrink-0">
                                    <img 
                                      src={resolveImageUrl(prod.image)} 
                                      alt={prod.title} 
                                      style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px', objectFit: 'cover' }}
                                      className="rounded-xl bg-surface-50 border border-white/10 shadow-sm" 
                                    />
                                  </Link>
                                  <div className="truncate max-w-[180px]">
                                    <Link to={`/product/${prod.slug || prod._id}`} className="font-black uppercase text-xs text-app-text hover:text-brand-primary transition-colors block truncate leading-tight">
                                      {prod.title}
                                    </Link>
                                    <span className="text-xs font-bold text-app-text/45 uppercase block mt-1 tracking-wide">
                                      {prod.category?.name || 'Unassigned'}
                                    </span>
                                    {(item.color || item.size) ? (
                                      <span className="text-xs font-bold text-brand-primary uppercase block mt-1 tracking-wider">
                                        {[item.color, item.size].filter(Boolean).join(' / ')}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>

                               {/* Quantity Controls with dynamic spinners */}
                               <td className="px-6 py-4 text-center">
                                 <div className="inline-flex items-center gap-2.5 rounded-xl border border-surface-100 bg-surface-50/70 px-2.5 py-1.5 shadow-sm">
                                   {updatingItemId === item._id ? (
                                     <div className="flex items-center justify-center px-4 py-0.5">
                                       <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-primary" />
                                     </div>
                                   ) : (
                                     <>
                                       <button
                                         onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                                         disabled={item.quantity <= 1 || updatingItemId !== null}
                                         className="text-app-text/50 hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                         title="Decrease Quantity"
                                       >
                                         <Minus className="h-3.5 w-3.5" />
                                       </button>
                                       <span className="text-xs font-extrabold px-1.5 font-mono">{item.quantity}</span>
                                       <button
                                         onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                                         disabled={updatingItemId !== null}
                                         className="text-app-text/50 hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                         title="Increase Quantity"
                                       >
                                         <Plus className="h-3.5 w-3.5" />
                                       </button>
                                     </>
                                   )}
                                 </div>
                                 {/* Show available stock hint */}
                                 {(() => {
                                   const stock = item.variant?.stock ?? prod.stock;
                                   if (stock !== undefined && stock !== null && stock <= 5) {
                                     return (
                                       <p className="text-[9px] font-bold text-red-400 mt-1 uppercase tracking-wider">
                                         {stock === 0 ? 'Out of stock' : `Only ${stock} left`}
                                       </p>
                                     );
                                   }
                                   return null;
                                 })()}
                               </td>

                              {/* Unit Price */}
                              <td className="px-6 py-4 text-right font-mono font-bold text-app-text/75 text-xs">
                                ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Subtotal */}
                              <td className="px-6 py-4 text-right font-mono font-black text-app-text text-xs">
                                ₹{itemSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleRemove(item._id)}
                                  disabled={updatingItemId !== null}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black transition-all shadow-sm mx-auto disabled:opacity-40 cursor-pointer"
                                  title="Remove Item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clear Cart Button */}
              <button
                onClick={async () => { const r = await clearCart(); if (r?.success) toast.success('Shopping bag cleared.'); }}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-500 border border-red-500/20 hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all self-start cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Empty Bag
              </button>
            </div>

            {/* Billing Order Summary Panel */}
            <div className="rounded-3xl border border-white/10 bg-surface-50/40 p-6 shadow-soft backdrop-blur-md space-y-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-app-text pb-2.5 border-b border-surface-100/50">
                Order Summary
              </h3>

              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between text-app-text/60">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-brand-primary">
                  <span>Shipping</span>
                  <span className="text-brand-primary font-black uppercase text-xs">Free Shipping</span>
                </div>
                <div className="flex justify-between text-app-text/60">
                  <span>Taxes (GST 18%)</span>
                  <span className="font-mono text-app-text/40">₹{billData.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex justify-between items-center text-brand-primary font-semibold animate-in fade-in duration-200">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Discount ({appliedCoupon.code})
                    </span>
                    <span className="font-mono font-bold">- ₹{appliedCoupon.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}
                
                <div className="h-px bg-surface-100/50 my-2" />

                <div className="flex justify-between text-app-text font-black pb-1">
                  <span className="uppercase text-xs tracking-wider font-black text-app-text">Total</span>
                  <span className="font-mono text-sm text-brand-primary font-black">
                    ₹{billData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Promo Codes */}
              <div className="pt-4 border-t border-surface-100/50 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-app-text/65">
                  Apply Promo Code
                </label>

                {!appliedCoupon ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applySuggestedCoupon(couponInput);
                          }
                        }}
                        className="flex-1 uppercase rounded-xl border border-surface-100 bg-surface-50/70 px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-primary text-white"
                      />
                      <button
                        type="button"
                        onClick={() => applySuggestedCoupon(couponInput)}
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_COUPONS.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          disabled={applyingCoupon}
                          onClick={() => applySuggestedCoupon(c.code)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 hover:border-brand-primary transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Ticket className="h-3.5 w-3.5 text-brand-primary" />
                          <span className="font-mono text-xs font-bold">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-2.5 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <Ticket className="h-4 w-4 text-brand-primary animate-pulse" />
                      <div>
                        <p className="font-mono text-xs font-bold leading-none">{appliedCoupon.code}</p>
                        <p className="text-xs text-brand-primary/70 font-sans mt-1">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountValue}% Off applied`
                            : `₹${appliedCoupon.discountValue} Off applied`
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-lg bg-brand-primary/10 p-1.5 text-brand-primary hover:bg-red-500 hover:text-black transition-all cursor-pointer"
                      title="Remove Coupon"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {couponError ? (
                  <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                    {couponError}
                  </p>
                ) : null}
              </div>

          {/* Guarantee / Security info */}
          <div className="rounded-2xl bg-surface-50/40 border border-white/10 p-3.5 flex items-start gap-3">
            <Lock className="h-4 w-4 text-app-text/45 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-app-text">Secure Checkout</p>
              <p className="text-[10px] text-app-text/40 font-sans leading-relaxed mt-0.5">
                Your transaction is secure. SSL-encrypted checkout details are configured natively.
              </p>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/20 p-3 text-center">
              <p className="text-xs font-bold text-brand-primary">Sign in to proceed to checkout</p>
            </div>
          )}

          <div className="space-y-2">
            <button
                  onClick={handleProceedCheckout}
                  disabled={checkoutLoading || updatingItemId !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary py-3.5 font-sans text-xs font-black uppercase tracking-widest text-black hover:opacity-90 disabled:opacity-50 transition-colors shadow-lg shadow-brand-primary/10 cursor-pointer"
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 text-black" />
                      <span className="text-black">{showCheckout ? 'Place order (Cash on Delivery)' : 'Proceed to Checkout'}</span>
                    </>
                  )}
                </button>
                {showCheckout && razorpayEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateShippingForm()) return;
                      handleRazorpayCheckout();
                    }}
                    disabled={checkoutLoading || updatingItemId !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-sans text-xs font-black uppercase tracking-widest text-app-text hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay online (Razorpay)
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* ── Step 2: Shipping Address (decoupled, full-width) ── */}
          {showCheckout ? (
            <motion.div
              initial={SHIPPING_INITIAL}
              animate={SHIPPING_ANIMATION}
              className="rounded-3xl border border-white/10 bg-surface-50/40 shadow-soft backdrop-blur-md p-6 space-y-5"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-surface-100/50">
                <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center text-black text-xs font-black">2</div>
                <h3 className="text-xs font-black uppercase tracking-wider text-app-text">Shipping Address</h3>
                <Link to="/profile" className="ml-auto text-xs font-bold text-app-text/40 hover:text-brand-primary underline transition-colors">
                  Edit in profile
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippingFields.map(({ key, label, type, maxLength }) => (
                  <div key={key} className={key === 'street' ? 'sm:col-span-2' : ''}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-app-text/50 block mb-1">{label}</label>
                    <input
                      type={type}
                      inputMode={key === 'phone' ? 'numeric' : undefined}
                      maxLength={maxLength}
                      value={shipping[key]}
                      onChange={(e) => {
                        const value = key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
                        setShipping((s) => ({ ...s, [key]: value }));
                        if (key === 'phone') setPhoneError('');
                      }}
                      className={`w-full rounded-xl border bg-surface-50/70 px-4 py-2.5 text-xs focus:outline-none focus:border-brand-primary transition-colors text-white ${
                        key === 'phone' && phoneError ? 'border-red-300' : 'border-white/5'
                      }`}
                    />
                    {key === 'phone' && phoneError ? (
                      <p className="mt-1 text-xs font-bold text-red-500">{phoneError}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {/* Upsell: Frequently Bought Together */}
          {!showCheckout && cart?.items?.length > 0 ? (
            <div className="pt-8 border-t border-surface-100/50">
              <FrequentlyBoughtTogether 
                productId={cart.items[0].product?._id} 
                title="Add to your bag?"
                subtitle="Customers who bought items in your bag also loved these."
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
