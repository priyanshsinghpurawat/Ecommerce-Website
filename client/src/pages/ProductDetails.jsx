import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProductVariants, getProductReviews, submitReview } from '../services/product.service.js';
import { 
  Loader2, ArrowLeft, Star, Heart, ShoppingBag, Clock, Check, X, 
  ShieldCheck, Sparkles, Shield, Share2, ChevronDown, ChevronUp, Camera 
} from 'lucide-react';
import { resolveImageUrl, getDiscountPercent } from '../utils/helpers.js';
import { toast } from 'react-hot-toast';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { SEO, ProductJsonLd } from '../components/SEO.jsx';
import { useWishlist } from '../hooks/useWishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { FrequentlyBoughtTogether } from '../components/FrequentlyBoughtTogether.jsx';
import { UrgencyNudge } from '../components/UrgencyNudge.jsx';

const CLOTHING_MEASUREMENTS = {
  // Tall Sizing (Competitor Standard)
  MT: { chest: '42 in', length: '32.5 in', shoulder: '19.5 in', sleeve: '27 in' },
  LT: { chest: '45 in', length: '33 in', shoulder: '20 in', sleeve: '27.5 in' },
  XLT: { chest: '48 in', length: '33.5 in', shoulder: '21.5 in', sleeve: '28 in' },
  '2XLT': { chest: '52 in', length: '34 in', shoulder: '22.5 in', sleeve: '28.5 in' },
  '3XLT': { chest: '56 in', length: '34.5 in', shoulder: '23.5 in', sleeve: '29 in' },
  // Standard Sizing (Backward Compatibility)
  XS: { chest: '40 in', length: '27 in', shoulder: '18.5 in', sleeve: '24 in' },
  S: { chest: '42 in', length: '28 in', shoulder: '19 in', sleeve: '24.5 in' },
  M: { chest: '44 in', length: '29 in', shoulder: '19.5 in', sleeve: '25 in' },
  L: { chest: '46 in', length: '30 in', shoulder: '20 in', sleeve: '25.5 in' },
  XL: { chest: '48 in', length: '31 in', shoulder: '20.5 in', sleeve: '26 in' },
  XXL: { chest: '50 in', length: '31.5 in', shoulder: '21 in', sleeve: '26.5 in' },
  '2XL': { chest: '50 in', length: '31.5 in', shoulder: '21 in', sleeve: '26.5 in' },
  '3XL': { chest: '52 in', length: '32 in', shoulder: '21.5 in', sleeve: '27 in' },
  '4XL': { chest: '54 in', length: '32.5 in', shoulder: '22 in', sleeve: '27.5 in' },
  '5XL': { chest: '56 in', length: '33 in', shoulder: '22.5 in', sleeve: '28 in' },
};

const BOTTOMS_MEASUREMENTS = {
  // Tall Sizing (Competitor Standard, Min 34 Inseam)
  '30x34': { waist: '30 in', inseam: '34 in', thigh: '24 in', rise: '11.5 in' },
  '32x34': { waist: '32 in', inseam: '34 in', thigh: '25 in', rise: '12 in' },
  '32x36': { waist: '32 in', inseam: '36 in', thigh: '25 in', rise: '12 in' },
  '34x34': { waist: '34 in', inseam: '34 in', thigh: '26 in', rise: '12.5 in' },
  '34x36': { waist: '34 in', inseam: '36 in', thigh: '26 in', rise: '12.5 in' },
  '36x36': { waist: '36 in', inseam: '36 in', thigh: '27 in', rise: '13 in' },
  '36x38': { waist: '36 in', inseam: '38 in', thigh: '27 in', rise: '13 in' },
  '38x36': { waist: '38 in', inseam: '36 in', thigh: '28 in', rise: '13.5 in' },
  '38x38': { waist: '38 in', inseam: '38 in', thigh: '28 in', rise: '13.5 in' },
  // Standard Sizing (Backward Compatibility)
  '28': { waist: '28 in', inseam: '30 in', thigh: '22 in', rise: '10.5 in' },
  '30': { waist: '30 in', inseam: '30 in', thigh: '23 in', rise: '11 in' },
  '32': { waist: '32 in', inseam: '32 in', thigh: '24 in', rise: '11.5 in' },
  '34': { waist: '34 in', inseam: '32 in', thigh: '25 in', rise: '12 in' },
  '36': { waist: '36 in', inseam: '32 in', thigh: '26 in', rise: '12.5 in' },
  '38': { waist: '38 in', inseam: '32 in', thigh: '27 in', rise: '13 in' },
  '40': { waist: '40 in', inseam: '32 in', thigh: '28 in', rise: '13.5 in' },
  '42': { waist: '42 in', inseam: '32 in', thigh: '29 in', rise: '14 in' },
  '44': { waist: '44 in', inseam: '32 in', thigh: '30 in', rise: '14.5 in' },
};

const FOOTWEAR_MEASUREMENTS = {
  // Tall Sizing (Competitor Standard)
  'UK 10.5': { length: '28.8 cm', sole: 'EVA Cushioned' },
  'UK 11': { length: '29.6 cm', sole: 'EVA Cushioned' },
  'UK 12': { length: '30.5 cm', sole: 'EVA Cushioned' },
  'UK 13': { length: '31.3 cm', sole: 'EVA Cushioned' },
  'UK 14': { length: '32.2 cm', sole: 'EVA Cushioned' },
  // Standard Sizing (Backward Compatibility)
  'UK 6': { length: '25.1 cm', sole: 'EVA Cushioned' },
  'UK 7': { length: '25.9 cm', sole: 'EVA Cushioned' },
  'UK 8': { length: '26.8 cm', sole: 'EVA Cushioned' },
  'UK 9': { length: '27.6 cm', sole: 'EVA Cushioned' },
  'UK 10': { length: '28.4 cm', sole: 'EVA Cushioned' },
};

export const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const isWishlisted = isInWishlist(id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // New Collapsible & Share States
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    setWishlistLoading(true);
    const res = await toggleWishlist(id);
    if (res.success) {
      toast.success(res.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist.');
    }
    setWishlistLoading(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Product link copied to clipboard!');
  };

  const handleAddToCart = async () => {
    // Ensure size is selected before adding to cart
    if (sizingData.sizeOptions.length > 0 && !selectedSize) {
      toast.error('Please select a size first.');
      return;
    }

    setCartLoading(true);
    const res = await addToCart(product._id, 1, {
      size: selectedSize,
      color: selectedColor,
      price: product.price,
      discountedPrice: product.discountedPrice,
      title: product.title,
      image: product.images?.[0] || product.image,
    });
    setCartLoading(false);
    if (res.success) {
      toast.success(`Added ${product.title} (${selectedSize}) to bag!`);
    } else {
      toast.error(res.error || 'Failed to add to bag.');
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setProduct(null);
      setSelectedImage(null);
      try {
        const response = await getProductById(id);
        if (response && response.success) {
          const prod = response.data;

          // Fetch standalone variants and map to legacy format for UI compatibility
          try {
            const variantsRes = await getProductVariants(prod._id);
            if (variantsRes?.data?.length) {
              prod.variants = variantsRes.data.map(v => ({
                color: v.optionValues?.Color || '',
                size: v.optionValues?.Size || '',
                sku: v.sku || '',
                stock: v.stock ?? 0,
                price: v.price ?? null,
                images: v.images || [],
                variantId: v._id
              }));
            }
          } catch {
            // Keep whatever variants came from the product document (legacy embedded)
            if (!prod.variants) prod.variants = [];
          }

          setProduct(prod);
          
          // Set default selected color & size
          let defaultColor = '';
          if (prod.variants?.length > 0) {
            const firstColorVariant = prod.variants.find(v => v.color);
            if (firstColorVariant) defaultColor = firstColorVariant.color;
          }
          if (defaultColor) setSelectedColor(defaultColor);

          // Force user to explicitly select a size (No auto-selection)
          setSelectedSize('');
        }
      } catch (err) {
        toast.error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Load reviews from API
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await getProductReviews(id);
        if (!cancelled && res?.success) {
          setReviews(res.data);
        }
      } catch {
        // Reviews may not exist yet — that's fine
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    fetchReviews();
    return () => { cancelled = true; };
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment.');
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await submitReview(id, { rating: reviewRating, comment: reviewComment.trim() });
      if (res?.success) {
        setReviews((prev) => [res.data, ...prev]);
        setReviewComment('');
        setReviewRating(5);
        toast.success('Thank you! Review submitted.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const relatedItems = product?.relatedProducts || [];

  const isFootwear = useMemo(() => {
    if (!product) return false;
    return product.category?.name?.toLowerCase() === 'footwear' || 
           product.subcategory?.name?.toLowerCase().includes('shoes') || 
           product.subcategory?.name?.toLowerCase().includes('sneakers');
  }, [product]);

  const isBottoms = useMemo(() => {
    if (!product) return false;
    const subName = product.subcategory?.name?.toLowerCase() || '';
    return subName.includes('pants') || 
           subName.includes('jeans') || 
           subName.includes('cargo') || 
           subName.includes('chino');
  }, [product]);

  const mainImage = useMemo(() => {
    if (selectedImage) return selectedImage;
    if (!product) return '';
    
    if (selectedColor) {
      const variantImgs = product.variants
        ?.filter(v => v.color === selectedColor)
        .flatMap(v => v.images || [])
        .filter(Boolean) || [];
      if (variantImgs.length > 0) return variantImgs[0];
    }
    return product.image;
  }, [product, selectedColor, selectedImage]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    return product.variants?.find(
      (v) => (v.color === selectedColor || !selectedColor) && v.size === selectedSize
    );
  }, [product, selectedColor, selectedSize]);

  const priceData = useMemo(() => {
    if (!product) return { basePrice: 0, discountedPrice: null, displayStock: 0, unitPrice: 0, showOriginalPrice: false };
    const basePrice = currentVariant?.price ?? product.price;
    const discountedPrice = currentVariant?.price ? (currentVariant.discountedPrice ?? null) : product.discountedPrice;
    const displayStock = currentVariant ? currentVariant.stock : product.stock;
    const hasDiscount = discountedPrice !== null && discountedPrice !== undefined;
    const unitPrice = hasDiscount ? discountedPrice : basePrice;
    const showOriginalPrice = hasDiscount && unitPrice >= 1500;
    return { basePrice, discountedPrice, displayStock, unitPrice, showOriginalPrice };
  }, [product, currentVariant]);

  const availableColors = useMemo(() => {
    if (!product) return [];
    return [...new Set([
      ...(product.variants?.map(v => v.color).filter(Boolean) || [])
    ])];
  }, [product]);

  const sizingData = useMemo(() => {
    if (!product) return { sizeOptions: [], outOfStockSizes: [] };
    let sizeOptions = isFootwear
      ? ['UK 10.5', 'UK 11', 'UK 12', 'UK 13', 'UK 14']
      : isBottoms
        ? ['30x34', '32x34', '32x36', '34x34', '34x36', '36x36', '38x36']
        : ['MT', 'LT', 'XLT', '2XLT', '3XLT'];
    let outOfStockSizes = [];

    if (product.variants && product.variants.length > 0) {
      const variantsForColor = product.variants.filter(v =>
        !selectedColor || v.color === selectedColor
      );
      const availableVariantSizes = [...new Set(
        variantsForColor.map(v => v.size).filter(Boolean)
      )];
      if (availableVariantSizes.length > 0) {
        sizeOptions = availableVariantSizes;
      }
      outOfStockSizes = variantsForColor
        .filter(v => v.size && Number(v.stock) === 0)
        .map(v => v.size);
    }
    return { sizeOptions, outOfStockSizes };
  }, [product, isFootwear, isBottoms, selectedColor]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const colorVariantImages = selectedColor
      ? (product.variants
          ?.filter(v => v.color === selectedColor)
          .flatMap(v => v.images || [])
          .filter(Boolean) || [])
      : [];

    return colorVariantImages.length > 0
      ? colorVariantImages
      : [...new Set([product.image, ...(product.images || [])])].filter(Boolean);
  }, [product, selectedColor]);

  const currentMeasure = useMemo(() => {
    if (!selectedSize) return null;
    return isFootwear 
      ? FOOTWEAR_MEASUREMENTS[selectedSize] 
      : isBottoms
        ? BOTTOMS_MEASUREMENTS[selectedSize]
        : CLOTHING_MEASUREMENTS[selectedSize];
  }, [isFootwear, isBottoms, selectedSize]);

  const handleCheckPincode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode.');
      return;
    }
    
    setCheckingPincode(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const resPost = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: controller.signal });
      if (resPost.ok) {
        const data = await resPost.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
          const postOffice = data[0].PostOffice[0];
          const area = postOffice.Name || postOffice.Block;
          const district = postOffice.District;
          const state = postOffice.State;
          setDeliveryStatus({
            success: true,
            message: `Delivery available to ${area}, ${district}, ${state}. Estimated 2-3 business days. Cash on delivery available.`
          });
          clearTimeout(timeoutId);
          setCheckingPincode(false);
          return;
        }
      }
    } catch (err) {
      console.warn("PostalPincode API failed, trying fallback...", err);
    }

    try {
      const resZip = await fetch(`https://api.zippopotam.us/IN/${pincode}`, { signal: controller.signal });
      if (resZip.ok) {
        const data = await resZip.json();
        if (data && data.places && data.places[0]) {
          const area = data.places[0]["place name"];
          const state = data.places[0].state;
          setDeliveryStatus({
            success: true,
            message: `Delivery available to ${area}, ${state}. Estimated 2-3 business days. Cash on delivery available.`
          });
          clearTimeout(timeoutId);
          setCheckingPincode(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Zippopotam API failed, trying offline validation...", err);
    } finally {
      clearTimeout(timeoutId);
    }

    const pinRegex = /^[1-9][0-9]{5}$/;
    if (pinRegex.test(pincode)) {
      setDeliveryStatus({
        success: true,
        message: 'Valid Pincode format. Assuming deliverable offline. Estimated 2-3 business days.'
      });
    } else {
      setDeliveryStatus({
        success: false,
        message: 'Invalid Pincode format. Please enter a valid 6-digit Indian PIN code.'
      });
    }
    setCheckingPincode(false);
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <SEO title={product?.title || 'Product Details'} description={product?.description?.slice(0, 160) || 'View product details at MensVibe.'} />
      <ProductJsonLd product={product} />
      <Link
        to="/shop"
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 hover:text-app-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
        </div>
      ) : !product ? (
        <div className="flex flex-col h-[50vh] items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight text-app-text">Product Not Found</h2>
          <p className="text-xs font-bold text-app-text/45 uppercase tracking-wider">The product you are looking for does not exist or has been removed.</p>
          <Link
            to="/shop"
            className="flex items-center gap-2 rounded-2xl bg-app-text px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider text-app-bg hover:bg-app-text-hover transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gallery Column: Vertical Thumbnails + Main Image */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Vertical Stack of Thumbnails */}
            {allImages.length > 1 ? (
              <div className="flex flex-row md:flex-col gap-3 md:max-h-[550px] overflow-x-auto md:overflow-y-auto scrollbar-hide w-full md:w-20 shrink-0">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative h-20 w-16 md:w-full shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      mainImage === img 
                        ? 'border-brand-primary scale-102 shadow-lg shadow-brand-primary/5' 
                        : 'border-border-base hover:border-app-text/50'
                    }`}
                  >
                    <img src={resolveImageUrl(img, 200)} className="h-full w-full object-cover" alt={product?.title || 'Product thumbnail'} />
                  </button>
                ))}
              </div>
            ) : null}

            {/* Main Hero Product Image */}
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-app-card border border-border-base group">
              <img
                src={resolveImageUrl(mainImage, 1200)}
                alt={product.title}
                loading="lazy"
                className="w-full aspect-[4/5] object-cover object-top transition-transform duration-1000 group-hover:scale-108"
              />
              
              {/* Dynamic Badge Overlay */}
              <div className="absolute left-6 top-6 flex flex-col gap-2">
                {product.badge ? (
                  <span className="bg-black text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-2xl border border-white/10">
                    {product.badge.replace('-', ' ')}
                  </span>
                ) : null}
              </div>

              {/* Action Buttons: Share & Wishlist */}
              <div className="absolute right-6 top-6 flex gap-3">
                <button
                  onClick={handleShare}
                  className="p-4 rounded-[1.5rem] backdrop-blur-xl border border-white/20 bg-black/40 text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                  title="Share Product Link"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className={`p-4 rounded-[1.5rem] backdrop-blur-xl border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg ${
                    isWishlisted ? 'bg-red-500 text-white border-red-500/30' : 'bg-black/40 text-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Hub Specifications */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-black uppercase tracking-tight text-app-text leading-[1.0]">
                {product.title}
              </h1>
              
              {currentVariant?.sku ? (
                <p className="text-[11px] font-bold text-app-text/40 uppercase tracking-widest">
                  SKU: {currentVariant.sku}
                </p>
              ) : null}

              <div className="flex items-baseline gap-4 pt-2">
                {priceData.showOriginalPrice ? (
                  <>
                    <span className="text-3xl font-black tracking-tighter text-app-text">
                      ₹{priceData.discountedPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-lg font-bold text-app-text/30 line-through tracking-tighter">
                      ₹{priceData.basePrice.toLocaleString('en-IN')}
                    </span>
                    {/* Consistent Acid Green Tag */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-md">
                      -{getDiscountPercent(priceData.basePrice, priceData.discountedPrice)}% Off
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-black tracking-tighter text-app-text">
                    ₹{priceData.unitPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              
              <p className="text-[10px] font-bold text-app-text/45 uppercase">Tax included.</p>
            </div>

            <div className="h-px bg-border" />

            {/* Color Section */}
            {availableColors.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
                  Colour: <span className="text-brand-primary">{selectedColor}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const variantImgs = product.variants
                      ?.filter(v => v.color === color)
                      .flatMap(v => v.images || [])
                      .filter(Boolean) || [];
                    const hasOwnImages = variantImgs.length > 0;
                    const thumbUrl = hasOwnImages ? variantImgs[0] : null;
                    const isActive = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedImage(null);
                          // Reset size selection when color changes so they must re-select for validation
                          setSelectedSize('');
                        }}
                        title={color}
                        className={`flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'border-brand-primary shadow-md shadow-brand-primary/20 scale-105'
                            : 'border-border hover:border-app-text/50'
                        }`}
                      >
                        {thumbUrl ? (
                          <div className="relative">
                            <img
                              src={thumbUrl}
                              alt={color}
                              className="w-12 h-14 rounded-xl object-cover"
                            />
                            {isActive ? (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-app-bg" />
                            ) : null}
                          </div>
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full border-2 ${
                              isActive ? 'border-brand-primary' : 'border-border'
                            }`}
                            style={{ backgroundColor: color.toLowerCase() === 'black' ? '#111' :
                                                       color.toLowerCase() === 'white' ? '#f5f5f5' :
                                                       color.toLowerCase() === 'blue' ? '#3b82f6' :
                                                       color.toLowerCase() === 'red' ? '#ef4444' :
                                                       color.toLowerCase() === 'green' ? '#22c55e' :
                                                       color.toLowerCase() === 'sand' ? '#c2b280' :
                                                       color.toLowerCase() === 'sage' ? '#8fae88' :
                                                       color.toLowerCase() === 'khaki' ? '#c3b091' :
                                                       color.toLowerCase() === 'navy' ? '#1e3a5f' :
                                                       color.toLowerCase() === 'grey' ? '#6b7280' :
                                                       color.toLowerCase() === 'brown' ? '#92400e' :
                                                       '#888888' }}
                          />
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                          isActive ? 'text-brand-primary' : 'text-muted'
                        }`}>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Sizing & Scarcity section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-app-text">Select Size</span>
                <button 
                  onClick={() => setShowSizeGuide(true)}
                  className="text-[10px] font-black uppercase tracking-wider text-app-text/45 hover:text-brand-primary underline decoration-dotted"
                >
                  Size Guide
                </button>
              </div>

              {/* Integrated Scarcity UrgencyNudge Component */}
              <UrgencyNudge
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
                sizes={sizingData.sizeOptions.map(size => ({
                  size,
                  stock: product.variants?.find(v => (!selectedColor || v.color === selectedColor) && v.size === size)?.stock ?? product.stock
                }))}
                remainingCount={priceData.displayStock}
                viewersLastHour={Math.floor(Math.random() * 34) + 12}
                soldPercent={82}
              />

              {/* Sizing measurements strip */}
              {currentMeasure ? (
                <div className="bg-[#161618] border border-white/10 p-3.5 rounded-2xl shadow-soft font-roboto">
                  <div className={`grid ${isFootwear ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-4`}>
                    {isFootwear ? (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Length</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.length}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sole</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.sole}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fit</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">Regular</span>
                        </div>
                      </>
                    ) : isBottoms ? (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Waist</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.waist}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Inseam</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.inseam}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Thigh</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.thigh}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Rise</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.rise}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Chest</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.chest}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Length</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.length}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Shoulder</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.shoulder}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sleeve</span>
                          <span className="text-[12px] font-bold text-white tracking-tight">{currentMeasure.sleeve}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Add to bag Action Button (Theme-aligned acid green look) */}
            <div className="space-y-4 pt-4">
              <button
                disabled={priceData.displayStock === 0 || cartLoading}
                onClick={handleAddToCart}
                className="w-full group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-primary hover:opacity-90 disabled:opacity-30 active:scale-98 shadow-xl py-4.5 text-black transition-all cursor-pointer"
              >
                {cartLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-black" />
                ) : (
                  <>
                    <ShoppingBag className="h-4.5 w-4.5 text-black" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black">
                      {priceData.displayStock === 0 ? 'Out of Stock' : 'ADD TO BAG'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3.5 text-[9px] font-black uppercase tracking-widest text-app-text/40 py-2">
                <Clock className="h-4 w-4 text-brand-primary shrink-0" />
                Easy 10-day return and exchange on this product. No questions asked.
              </div>
            </div>

            {/* Description Accordion (Design details & Story) */}
            {product.description && (
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/2 transition-colors">
                <button
                  type="button"
                  onClick={() => setIsDescOpen(!isDescOpen)}
                  className="w-full px-5 py-4 flex items-center justify-between text-xs font-black uppercase tracking-wider text-white hover:bg-white/5 transition-all text-left"
                >
                  <span>Design Details & Specs</span>
                  {isDescOpen ? <ChevronUp className="h-4 w-4 text-brand-primary" /> : <ChevronDown className="h-4 w-4 text-brand-primary" />}
                </button>
                {isDescOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-white/70 leading-relaxed font-sans border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                    {product.description}
                  </div>
                )}
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Check Delivery pincode check */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-app-text">Check Delivery:</h4>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 rounded-xl border border-border bg-app-panel px-4 py-2 text-xs font-sans focus:outline-none focus:border-brand-primary"
                />
                <button 
                  type="submit"
                  disabled={checkingPincode}
                  className="rounded-xl border border-app-text bg-app-text px-6 text-[10px] font-black uppercase tracking-wider text-black hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  {checkingPincode ? 'Checking...' : 'CHECK'}
                </button>
              </form>
              {deliveryStatus ? (
                <p className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${deliveryStatus.success ? 'text-brand-primary' : 'text-red-500'}`}>
                  {deliveryStatus.success ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {deliveryStatus.message}
                </p>
              ) : null}
            </div>

            {/* Exclusive Coupon Card (Dashed Border) */}
            <div className="border border-dashed border-brand-primary/30 bg-brand-primary/[0.02] rounded-2xl p-4.5 space-y-2 mt-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Exclusive Store Offer</span>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-xs font-black text-white">Get 10% OFF your purchase</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-wide mt-0.5">Use coupon code at checkout</p>
                </div>
                <span className="font-mono text-[11px] font-black px-3.5 py-1.5 rounded-xl border border-dashed border-brand-primary/50 text-brand-primary bg-brand-primary/10 select-all shrink-0">
                  MENSVIBE10
                </span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Trust Badges Section Redesigned */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShieldCheck, label: '100% Genuine', text: 'Authentic Products', id: 'trust-genuine' },
                { icon: ShoppingBag, label: 'Easy Returns', text: '10-Day Policy', id: 'trust-returns' },
                { icon: Sparkles, label: 'Quality Check', text: '2-Level Verified', id: 'trust-quality' },
                { icon: Shield, label: 'Secure Pay', text: 'SSL Encrypted', id: 'trust-secure' }
              ].map((item) => (
                <div key={item.id} id={item.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-brand-primary/15 bg-black hover:border-brand-primary/30 transition-all">
                  <div className="h-9 w-9 rounded-xl bg-brand-primary flex items-center justify-center text-black shrink-0 shadow-md shadow-brand-primary/20">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white leading-tight">{item.label}</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-tight mt-0.5">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Frequently Bought Together (Complete the Look) */}
      <div className="pt-16 border-t border-border">
        <FrequentlyBoughtTogether 
          productId={id} 
          title="Styled With" 
          subtitle="Complete the look with these compatible items handpicked for this outfit."
        />
      </div>

      {/* Related Products Section */}
      {relatedItems.length > 0 ? (
        <div className="pt-16 space-y-8 border-t border-border">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Handpicked for you</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-app-text">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedItems.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Interactive Reviews Section with Photo Attachments */}
      <div className="pt-16 space-y-8 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary italic">User Feedback</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-app-text">Product Reviews</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex text-brand-primary">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product?.rating || 0) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-xs font-black uppercase text-white/60">
              {product?.reviewCount || reviews.length} Ratings Verified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Write a review Form */}
          <div className="lg:col-span-1 glass-card-premium p-6 rounded-[2rem] h-fit space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary">Write A Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star Rating Select */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 active:scale-90 transition-transform"
                    >
                      <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-brand-primary text-brand-primary' : 'text-white/20'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block">Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about product quality, fit, and sizing..."
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-brand-primary transition-all font-sans resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3.5 bg-brand-primary text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-brand-primary/10 cursor-pointer disabled:opacity-50"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
            
          </div>

          {/* Review List */}
          <div className="lg:col-span-2 space-y-4">
            {reviewsLoading ? (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem]">
                <Loader2 className="h-6 w-6 animate-spin text-white/30 mx-auto" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((rev) => {
                const initials = rev.name ? rev.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                return (
                  <div key={rev._id} className="p-6 rounded-[2rem] glass-card-premium space-y-4 hover:border-white/15 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center text-black font-black text-xs">
                          {initials}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-white">{rev.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex text-brand-primary">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`h-3 w-3 ${s <= rev.rating ? 'fill-brand-primary' : 'text-white/10'}`} />
                              ))}
                            </div>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{rev.date}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-md">Verified Fit</span>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      {rev.comment}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem] opacity-30 italic text-xs font-bold uppercase">
                Be the first to review this product!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal Popup */}
      {showSizeGuide && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-app-card text-app-text rounded-[2rem] border border-border p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setShowSizeGuide(false)} 
              className="absolute top-5 right-5 text-app-text/60 hover:text-app-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-black uppercase tracking-wider text-app-text mb-4">
              Size Guide ({isFootwear ? 'Footwear' : isBottoms ? 'Bottoms' : 'Clothing'})
            </h3>
            
            {isFootwear ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase text-app-text/45">
                    <th className="py-2.5">UK Size</th>
                    <th className="py-2.5">Foot Length</th>
                    <th className="py-2.5">US Size</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-app-text/75">
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 10.5</td><td className="py-2.5">28.8 cm</td><td className="py-2.5">US 11.5</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 11</td><td className="py-2.5">29.6 cm</td><td className="py-2.5">US 12</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 12</td><td className="py-2.5">30.5 cm</td><td className="py-2.5">US 13</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 13</td><td className="py-2.5">31.3 cm</td><td className="py-2.5">US 14</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 14</td><td className="py-2.5">32.2 cm</td><td className="py-2.5">US 15</td></tr>
                </tbody>
              </table>
            ) : isBottoms ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase text-app-text/45">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Waist</th>
                    <th className="py-2.5">Inseam</th>
                    <th className="py-2.5">Thigh</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-app-text/75">
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">30x34</td><td className="py-2.5">30 in</td><td className="py-2.5">34 in</td><td className="py-2.5">24 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">32x34</td><td className="py-2.5">32 in</td><td className="py-2.5">34 in</td><td className="py-2.5">25 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">32x36</td><td className="py-2.5">32 in</td><td className="py-2.5">36 in</td><td className="py-2.5">25 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">34x34</td><td className="py-2.5">34 in</td><td className="py-2.5">34 in</td><td className="py-2.5">26 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">34x36</td><td className="py-2.5">34 in</td><td className="py-2.5">36 in</td><td className="py-2.5">26 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">36x36</td><td className="py-2.5">36 in</td><td className="py-2.5">36 in</td><td className="py-2.5">27 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">38x36</td><td className="py-2.5">38 in</td><td className="py-2.5">36 in</td><td className="py-2.5">28 in</td></tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase text-app-text/45">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Chest</th>
                    <th className="py-2.5">Length</th>
                    <th className="py-2.5">Sleeve</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-app-text/75">
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">MT</td><td className="py-2.5">42 in</td><td className="py-2.5">32.5 in</td><td className="py-2.5">27 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">LT</td><td className="py-2.5">45 in</td><td className="py-2.5">33 in</td><td className="py-2.5">27.5 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">XLT</td><td className="py-2.5">48 in</td><td className="py-2.5">33.5 in</td><td className="py-2.5">28 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">2XLT</td><td className="py-2.5">52 in</td><td className="py-2.5">34 in</td><td className="py-2.5">28.5 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">3XLT</td><td className="py-2.5">56 in</td><td className="py-2.5">34.5 in</td><td className="py-2.5">29 in</td></tr>
                </tbody>
              </table>
            )}
            <button 
              onClick={() => setShowSizeGuide(false)}
              className="mt-6 w-full py-3 bg-app-text text-app-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity select-none cursor-pointer"
            >
              Close Chart
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
