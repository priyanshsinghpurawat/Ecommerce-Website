import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
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
  Sparkles,
  Tag,
  Ticket,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { applyCoupon } from '../services/coupon.service.js';
import {
  createCheckout,
  verifyPayment,
  getPaymentConfig
} from '../services/payment.service.js';
import { createOrder } from '../services/order.service.js';
import { getProfile } from '../services/user.service.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { DEFAULT_SHIPPING, SUGGESTED_COUPONS } from '../constants/checkout.js';
import { validateIndianPhone } from '../utils/phone.js';
import { getErrorMessage } from '../utils/apiHelpers.js';

export const Cart = () => {
  const { 
    cart, 
    cartTotal, 
    cartItemsCount, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [shipping, setShipping] = useState({ ...DEFAULT_SHIPPING });

  const shippingFields = [
    { key: 'fullName', label: 'Full name', type: 'text' },
    { key: 'phone', label: 'Phone (10 digits)', type: 'tel', maxLength: 10 },
    { key: 'street', label: 'Street address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'zipCode', label: 'PIN code', type: 'text', maxLength: 6 }
  ];

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        if (res?.success) {
          const u = res.data;
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
      } catch {
        // Profile optional — Jaipur defaults remain
      }
    };
    const loadPaymentConfig = async () => {
      try {
        const res = await getPaymentConfig();
        setRazorpayEnabled(Boolean(res?.data?.razorpayEnabled));
      } catch {
        setRazorpayEnabled(false);
      }
    };
    loadProfile();
    loadPaymentConfig();
  }, [isAuthenticated]);

  const handleQuantityChange = async (productId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    
    const res = await updateQuantity(productId, newQty);
    if (!res.success) {
      toast.error(res.error || 'Failed to update quantity.');
    }
  };

  const handleRemove = async (productId) => {
    const res = await removeFromCart(productId);
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
        paymentMethod: 'cod'
      });
      if (res?.success) {
        alert('Order placed');
        toast.success('Order placed! Pay when your delivery arrives.');
        await clearCart();
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
        couponCode: appliedCoupon?.code
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
              await clearCart();
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
    if (!showCheckout) {
      setShowCheckout(true);
      return;
    }
    if (!validateShippingForm()) return;
    handlePlaceCodOrder();
  };

  const applySuggestedCoupon = async (code) => {
    if (appliedCoupon?.code === code) return;

    setApplyingCoupon(true);
    setCouponError('');
    try {
      const response = await applyCoupon(code, cartTotal, cart.items);
      if (response?.success) {
        setAppliedCoupon(response.data);
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

  useEffect(() => {
    if (appliedCoupon) {
      if (cartItemsCount === 0 || cartTotal === 0) {
        setAppliedCoupon(null);
        return;
      }
      
      const reapply = async () => {
        try {
          const response = await applyCoupon(appliedCoupon.code, cartTotal, cart.items);
          if (response && response.success) {
            setAppliedCoupon(response.data);
          }
        } catch (err) {
          // If it fails (e.g. min spend not met anymore), remove the coupon
          setAppliedCoupon(null);
          const msg = err.response?.data?.message || 'Coupon removed due to updated cart total.';
          toast.error(msg);
        }
      };
      
      reapply();
    }
  }, [cartTotal, cartItemsCount]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="h-16 w-16 bg-lux-50 rounded-full flex items-center justify-center text-lux-dark/45 mb-4 shadow-soft">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-lux-dark mb-2">Sign in to see your bag</h2>
        <p className="text-sm text-lux-dark/55 max-w-sm mb-6 leading-relaxed">
          Your cart is tied to your account so it stays put between visits.
        </p>
        <Link 
          to="/login"
          state={{ from: '/cart' }}
          className="rounded-2xl bg-lux-dark px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-lux-dark-hover shadow-lg shadow-lux-dark/20 transition-all duration-300"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lux-dark">Your bag</h1>
          <p className="text-sm text-lux-dark/55">Review items before checkout.</p>
        </div>
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lux-dark/50 hover:text-lux-dark transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continue Shopping
        </Link>
      </div>

      {loading && !cart ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lux-dark/45" />
        </div>
      ) : cartItemsCount === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-lux-200 bg-lux-50/20 py-16 px-8 flex flex-col items-center justify-center text-center shadow-soft backdrop-blur-md min-h-[380px]"
        >
          <div className="h-16 w-16 bg-lux-50/60 rounded-full flex items-center justify-center text-lux-dark/40 border border-white shadow-sm mb-6 flex-shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-lux-dark mb-2">
            Your bag is empty
          </h2>
          <p className="text-xs text-lux-dark/45 font-sans mb-8 max-w-sm leading-relaxed">
            Explore our curated luxury collection of sophisticated, handcrafted essentials to bring comfort and elegance into your everyday life.
          </p>
          <Link
            to="/shop"
            className="rounded-2xl bg-lux-dark px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-lux-dark-hover transition-all duration-300 shadow-lg shadow-lux-dark/20 flex-shrink-0"
          >
            Explore Collection
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Table Container */}
          <div className="lg:col-span-2 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-lux-50/40 shadow-soft backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-lux-100 bg-lux-50/30 text-[10px] font-bold uppercase tracking-wider text-lux-dark/45">
                      <th className="px-6 py-4">Item Details</th>
                      <th className="px-6 py-4 text-center">Quantity</th>
                      <th className="px-6 py-4 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lux-100/40 text-xs font-semibold text-lux-dark">
                    <AnimatePresence initial={false}>
                      {cart.items.map((item) => {
                        const prod = item.product;
                        if (!prod) return null;

                        const hasDiscount = prod.discountedPrice !== null && prod.discountedPrice !== undefined;
                        const unitPrice = hasDiscount ? prod.discountedPrice : prod.price;
                        const itemSubtotal = unitPrice * item.quantity;

                        return (
                          <motion.tr 
                            key={prod._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-lux-50/20 transition-all align-middle"
                          >
                            {/* Product Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <Link to={`/product/${prod._id}`} className="block w-[56px] h-[56px] flex-shrink-0">
                                  <img 
                                    src={resolveImageUrl(prod.image)} 
                                    alt={prod.title} 
                                    style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', objectFit: 'cover' }}
                                    className="rounded-xl bg-lux-50 border border-white shadow-sm" 
                                  />
                                </Link>
                                <div className="truncate max-w-[180px]">
                                  <Link to={`/product/${prod._id}`} className="font-extrabold uppercase text-[11px] text-lux-dark hover:text-lux-primary transition-colors block truncate">
                                    {prod.title}
                                  </Link>
                                  <span className="text-[9px] font-bold text-lux-dark/40 uppercase block mt-0.5">
                                    {prod.category?.name || 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Quantity Controls */}
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-2.5 rounded-xl border border-lux-100 bg-lux-50/70 px-2.5 py-1.5 shadow-sm">
                                <button
                                  onClick={() => handleQuantityChange(prod._id, item.quantity, -1)}
                                  disabled={item.quantity <= 1}
                                  className="text-lux-dark/50 hover:text-lux-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Decrease Quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-extrabold px-1 font-mono">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(prod._id, item.quantity, 1)}
                                  className="text-lux-dark/50 hover:text-lux-dark transition-colors"
                                  title="Increase Quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="px-6 py-4 text-right font-mono font-bold text-lux-dark/75">
                              ₹{unitPrice.toFixed(2)}
                            </td>

                            {/* Subtotal */}
                            <td className="px-6 py-4 text-right font-mono font-extrabold text-lux-dark">
                              ₹{itemSubtotal.toFixed(2)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleRemove(prod._id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-black transition-all shadow-sm mx-auto"
                                title="Remove Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              onClick={() => {
                if (window.confirm('Are you sure you want to empty your shopping bag?')) {
                  clearCart();
                  toast.success('Shopping bag cleared.');
                }
              }}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400 hover:text-red-500 border border-red-100 hover:bg-red-50/30 px-3.5 py-2 rounded-xl transition-all self-start"
            >
              <Trash2 className="h-3 w-3" />
              Empty Shopping Bag
            </button>
          </div>

          {/* Billing Order Summary Panel */}
          <div className="rounded-3xl border border-white/60 bg-lux-50/40 p-6 shadow-soft backdrop-blur-md space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-lux-dark pb-2.5 border-b border-lux-100/50">
              Order Summary
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between text-lux-dark/60">
                <span>Subtotal</span>
                <span className="font-mono font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lux-dark/60">
                <span>Shipping</span>
                <span className="text-emerald-600 font-bold uppercase text-[10px]">Free Shipping</span>
              </div>
              <div className="flex justify-between text-lux-dark/60">
                <span>Taxes</span>
                <span className="font-mono text-lux-dark/40">₹0.00</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-600 font-semibold animate-in fade-in duration-200">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Discount ({appliedCoupon.code})
                  </span>
                  <span className="font-mono font-bold">- ₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="h-px bg-lux-100/50 my-2" />

              <div className="flex justify-between text-lux-dark font-extrabold pb-1">
                <span className="uppercase text-[10px] tracking-wider font-extrabold text-lux-dark">Total</span>
                <span className="font-mono text-sm text-lux-dark">
                  ₹{(appliedCoupon ? appliedCoupon.finalTotal : cartTotal).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Suggested promo codes */}
            <div className="pt-4 border-t border-lux-100/50 space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-lux-dark/65">
                Offers — tap to apply
              </label>

              {!appliedCoupon ? (
                <div className="flex flex-col gap-2">
                  {SUGGESTED_COUPONS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      disabled={applyingCoupon}
                      onClick={() => applySuggestedCoupon(c.code)}
                      className="flex items-center justify-between rounded-xl border border-lux-100 bg-lux-50/70 px-3.5 py-2.5 text-left hover:border-lux-primary hover:bg-lux-50/50 transition-colors disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-lux-primary" />
                        <span>
                          <span className="font-mono text-xs font-bold text-lux-dark">{c.code}</span>
                          <span className="block text-[9px] text-lux-dark/50">{c.label} · {c.hint}</span>
                        </span>
                      </span>
                      {applyingCoupon ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-lux-dark/40" />
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-lux-primary">Apply</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Ticket className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <div>
                      <p className="font-mono text-xs font-bold leading-none">{appliedCoupon.code}</p>
                      <p className="text-[9px] text-emerald-600/70 font-sans mt-0.5">
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
                    className="rounded-lg bg-emerald-100/50 p-1 text-emerald-700 hover:bg-red-50 hover:text-red-500 transition-all"
                    title="Remove Coupon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                  {couponError}
                </p>
              )}
            </div>

            {showCheckout && (
              <div className="space-y-3 pt-2 border-t border-lux-100/50 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-lux-dark">
                  Shipping — default Jaipur
                </p>
                {shippingFields.map(({ key, label, type, maxLength }) => (
                  <div key={key}>
                    <label className="text-[9px] font-bold uppercase text-lux-dark/50">{label}</label>
                    <input
                      type={type}
                      inputMode={key === 'phone' ? 'numeric' : undefined}
                      maxLength={maxLength}
                      value={shipping[key]}
                      onChange={(e) => {
                        const value =
                          key === 'phone'
                            ? e.target.value.replace(/\D/g, '').slice(0, 10)
                            : e.target.value;
                        setShipping((s) => ({ ...s, [key]: value }));
                        if (key === 'phone') setPhoneError('');
                      }}
                      className={`mt-0.5 w-full rounded-xl border bg-lux-50/70 px-3 py-2 text-xs focus:outline-none focus:border-lux-primary ${
                        key === 'phone' && phoneError ? 'border-red-300' : 'border-lux-100'
                      }`}
                    />
                    {key === 'phone' && phoneError && (
                      <p className="mt-1 text-[9px] font-bold text-red-500">{phoneError}</p>
                    )}
                  </div>
                ))}
                <Link to="/profile" className="text-[9px] font-bold text-lux-dark/50 hover:text-lux-dark underline">
                  Save a different default in profile
                </Link>
              </div>
            )}

            {/* Guarantee / Security info */}
            <div className="rounded-2xl bg-lux-50/40 border border-white/60 p-3.5 flex items-start gap-3">
              <Lock className="h-4 w-4 text-lux-dark/45 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-lux-dark">Secure Checkout</p>
                <p className="text-[8px] text-lux-dark/40 font-sans leading-relaxed">
                  Your transaction is secure. SSL-encrypted checkout details are configured natively.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleProceedCheckout}
                disabled={checkoutLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lux-dark py-3.5 font-sans text-xs font-bold uppercase tracking-wider text-black hover:bg-lux-dark-hover disabled:opacity-50 transition-colors shadow-lg shadow-lux-dark/20"
              >
                {checkoutLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    {showCheckout ? 'Place order (Cash on Delivery)' : 'Proceed to Checkout'}
                  </>
                )}
              </button>
              {showCheckout && razorpayEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateShippingForm()) return;
                    handleRazorpayCheckout();
                  }}
                  disabled={checkoutLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-lux-200 bg-lux-50/80 py-3 font-sans text-[10px] font-bold uppercase tracking-wider text-lux-dark hover:bg-lux-50 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay online (Razorpay)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
