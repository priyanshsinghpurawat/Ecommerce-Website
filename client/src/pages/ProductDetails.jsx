import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProducts } from '../services/product.service.js';
import { Loader2, ArrowLeft, Shield, Sparkles, Star, Heart, ShoppingBag, ShieldCheck, Clock, Check, X } from 'lucide-react';
import { getDiscountPercent } from '../utils/imageUrl.js';
import { toast } from 'react-hot-toast';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';

const CLOTHING_MEASUREMENTS = {
  S: { chest: '42 in', length: '28 in', shoulder: '19 in', sleeve: '24.5 in' },
  M: { chest: '44 in', length: '29 in', shoulder: '19.5 in', sleeve: '25 in' },
  L: { chest: '46 in', length: '30 in', shoulder: '20 in', sleeve: '25.5 in' },
  XL: { chest: '48 in', length: '31 in', shoulder: '20.5 in', sleeve: '26 in' },
  '2XL': { chest: '50 in', length: '31.5 in', shoulder: '21 in', sleeve: '26.5 in' },
  '3XL': { chest: '52 in', length: '32 in', shoulder: '21.5 in', sleeve: '27 in' },
  '4XL': { chest: '54 in', length: '32.5 in', shoulder: '22 in', sleeve: '27.5 in' },
  '5XL': { chest: '56 in', length: '33 in', shoulder: '22.5 in', sleeve: '28 in' },
};

const FOOTWEAR_MEASUREMENTS = {
  'UK 6': { length: '25.1 cm', sole: 'EVA Cushioned' },
  'UK 7': { length: '25.9 cm', sole: 'EVA Cushioned' },
  'UK 8': { length: '26.8 cm', sole: 'EVA Cushioned' },
  'UK 9': { length: '27.6 cm', sole: 'EVA Cushioned' },
  'UK 10': { length: '28.4 cm', sole: 'EVA Cushioned' },
  'UK 11': { length: '29.3 cm', sole: 'EVA Cushioned' },
};

export const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [selectedColor, setSelectedColor] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const [lookalikeProducts, setLookalikeProducts] = useState([]);
  const [similarClothes, setSimilarClothes] = useState([]);

  const isWishlisted = isInWishlist(id);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    setCartLoading(true);
    const res = await addToCart(product._id, 1);
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
      try {
        const response = await getProductById(id);
        if (response && response.success) {
          const prod = response.data;
          setProduct(prod);
          setMainImage(prod.image);
          
          // Set default selected color & size
          let defaultColor = '';
          if (prod.colors?.length > 0) {
            defaultColor = prod.colors[0].name;
          } else if (prod.variants?.length > 0) {
            const firstColorVariant = prod.variants.find(v => v.color);
            if (firstColorVariant) defaultColor = firstColorVariant.color;
          }
          if (defaultColor) setSelectedColor(defaultColor);

          const isFoot = prod.category?.name?.toLowerCase() === 'footwear' || prod.subcategory?.name?.toLowerCase().includes('shoes') || prod.subcategory?.name?.toLowerCase().includes('sneakers');
          setSelectedSize(isFoot ? 'UK 8' : 'S');

          // Fetch Lookalike Products (Same subcategory)
          if (prod.subcategory?._id) {
            const lookalikeRes = await getProducts({ subcategory: prod.subcategory._id, limit: 6 });
            const filteredLookalikes = (lookalikeRes?.data?.products || []).filter(p => String(p._id) !== String(id));
            setLookalikeProducts(filteredLookalikes);
          }

          // Fetch "Complete Your Look" — same category, different subcategory
          const subcategoryId = prod.subcategory?._id;
          if (prod.category?._id) {
            const similarRes = await getProducts({ category: prod.category._id, limit: 12 });
            const allOtherProds = (similarRes?.data?.products || []).filter(p => String(p._id) !== String(id));
            const filteredSimilar = allOtherProds.filter(p => String(p.subcategory?._id) !== String(subcategoryId)).slice(0, 6);
            setSimilarClothes(filteredSimilar);
          }
        }
      } catch (err) {
        toast.error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);



  // Update mainImage if selectedColor changes and variant has images
  useEffect(() => {
    if (product && selectedColor) {
      const colorObj = product.colors?.find(c => c.name === selectedColor);
      if (colorObj?.images?.[0]) {
        setMainImage(colorObj.images[0]);
        return;
      }
      const variant = product.variants?.find(v => v.color === selectedColor && v.images?.length > 0);
      if (variant) {
        setMainImage(variant.images[0]);
      }
    }
  }, [selectedColor, product]);

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode.');
      return;
    }
    // Basic mocked validation for restricted zones
    if (['000000', '999999'].includes(pincode)) {
      toast.error('Delivery is not available in this area.');
      return;
    }
    setCheckingPincode(true);
    setTimeout(() => {
      setCheckingPincode(false);
      setDeliveryStatus({
        success: true,
        message: 'Estimated delivery in 2-3 business days. Cash on delivery available.'
      });
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-app-text/45" />
      </div>
    );
  }

  if (!product) {
    return (
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
    );
  }

  const hasDiscount = product.discountedPrice !== null && product.discountedPrice !== undefined;
  const unitPrice = hasDiscount ? product.discountedPrice : product.price;
  const showOriginalPrice = hasDiscount && unitPrice >= 1500;

  const isFootwear = product.category?.name?.toLowerCase() === 'footwear' || 
                      product.subcategory?.name?.toLowerCase().includes('shoes') || 
                      product.subcategory?.name?.toLowerCase().includes('sneakers');

  const availableColors = [...new Set([
    ...(product.colors?.map(c => c.name) || []),
    ...(product.variants?.map(v => v.color).filter(Boolean) || [])
  ])];

  let sizeOptions = isFootwear ? ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'] : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  let outOfStockSizes = isFootwear ? ['UK 11'] : ['4XL', '5XL'];

  if (product.variants && product.variants.length > 0) {
    const variantsForColor = product.variants.filter(v => v.color === selectedColor || !selectedColor);
    const availableVariantSizes = [...new Set(variantsForColor.map(v => v.size).filter(Boolean))];
    if (availableVariantSizes.length > 0) {
      sizeOptions = availableVariantSizes;
      outOfStockSizes = variantsForColor.filter(v => v.stock === 0).map(v => v.size);
    }
  }

  // Consolidate images from product, colors, and variants
  const allImages = [...new Set([
    product.image,
    ...(product.images || []),
    ...(product.colors?.flatMap(c => c.images || []) || []),
    ...(product.variants?.flatMap(v => v.images || []) || [])
  ])].filter(Boolean);

  const currentMeasure = isFootwear 
    ? FOOTWEAR_MEASUREMENTS[selectedSize] 
    : CLOTHING_MEASUREMENTS[selectedSize];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <Link
        to="/shop"
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 hover:text-app-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gallery Column: Vertical Thumbnails + Main Image */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Vertical Stack of Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-row md:flex-col gap-3 md:max-h-[550px] overflow-x-auto md:overflow-y-auto scrollbar-hide w-full md:w-20 shrink-0">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`relative h-20 w-16 md:w-full shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    mainImage === img 
                      ? 'border-brand-primary scale-102 shadow-lg shadow-brand-primary/5' 
                      : 'border-border-base hover:border-app-text/50'
                  }`}
                >
                  <img src={resolveImageUrl(img, 200)} className="h-full w-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Product Image */}
          <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-app-card border border-border-base group">
            <img
              src={resolveImageUrl(mainImage, 1200)}
              alt={product.title}
              loading="lazy"
              className="w-full aspect-[4/5] object-cover object-top transition-transform duration-1000 group-hover:scale-102"
            />
            
            {/* Dynamic Status Overlay */}
            <div className="absolute left-6 top-6 flex flex-col gap-2">
              <span className="bg-black text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-2xl border border-white/10">
                NEW ARRIVAL
              </span>
            </div>

            <button
              onClick={handleWishlist}
              className={`absolute right-6 top-6 p-4 rounded-[1.5rem] backdrop-blur-xl border border-white/20 transition-all hover:scale-110 active:scale-95 ${
                isWishlisted ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-black/40 text-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Hub Specifications */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-black uppercase tracking-tight text-app-text leading-[1.0]">
              {product.title}
            </h1>
            
            <p className="text-[11px] font-bold text-app-text/40 uppercase tracking-widest">
              SKU: {product._id ? `${product._id.slice(-7).toUpperCase()}-${selectedSize}` : '1547921-S'}
            </p>

            <div className="flex items-baseline gap-4 pt-2">
              {showOriginalPrice ? (
                <>
                  <span className="text-3xl font-black tracking-tighter text-app-text">
                    ₹{product.discountedPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-lg font-bold text-app-text/30 line-through tracking-tighter">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                    -{getDiscountPercent(product.price, product.discountedPrice)}% Off
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black tracking-tighter text-app-text">
                  ₹{unitPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            
            <p className="text-[10px] font-bold text-app-text/45 uppercase">Tax included.</p>
          </div>

          <div className="h-px bg-border" />

          {/* Color Section */}
          {availableColors.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
                Color: {selectedColor}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      // Reset size if the new color doesn't have the current size
                      if (product.variants && product.variants.length > 0) {
                        const newSizes = product.variants.filter(v => v.color === color).map(v => v.size);
                        if (newSizes.length > 0 && !newSizes.includes(selectedSize)) {
                          setSelectedSize(newSizes[0]);
                        }
                      }
                    }}
                    className={`h-11 px-4 text-xs font-bold rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? 'border-app-text bg-app-text text-[#c1ff00]'
                        : 'border-border bg-app-panel hover:border-app-text text-app-text'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizing Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
                Size: {selectedSize}
              </h3>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-[10px] font-black uppercase tracking-wider text-app-text/45 hover:text-brand-primary underline decoration-dotted"
              >
                Size Guide
              </button>
            </div>

            {/* Sizing measurements strip (Gold/Beige style) */}
            {currentMeasure && (
              <div className="bg-[#fcf8f2] border border-[#f0e4d2] px-4 py-2.5 rounded-xl text-[10px] font-bold text-[#806132] font-mono flex flex-wrap gap-x-4 gap-y-1">
                {isFootwear ? (
                  <>
                    <span>Length: {currentMeasure.length}</span>
                    <span>•</span>
                    <span>Sole: {currentMeasure.sole}</span>
                    <span>•</span>
                    <span>Fit: Regular</span>
                  </>
                ) : (
                  <>
                    <span>Chest: {currentMeasure.chest}</span>
                    <span>•</span>
                    <span>Length: {currentMeasure.length}</span>
                    <span>•</span>
                    <span>Shoulder: {currentMeasure.shoulder}</span>
                    <span>•</span>
                    <span>Sleeve: {currentMeasure.sleeve}</span>
                  </>
                )}
              </div>
            )}

            {/* Size selector buttons */}
            <div className="flex flex-wrap gap-2.5">
              {sizeOptions.map((size) => {
                const isOutOfStock = outOfStockSizes.includes(size);
                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 w-11 text-xs font-bold rounded-lg border-2 transition-all relative ${
                      selectedSize === size
                        ? 'border-app-text bg-app-text text-black'
                        : isOutOfStock
                          ? 'border-border bg-app-panel/30 text-app-text/20 cursor-not-allowed lines-out'
                          : 'border-border bg-app-panel hover:border-app-text text-app-text'
                    }`}
                  >
                    {size}
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-full h-[1px] bg-border rotate-45" />
                        <span className="w-full h-[1px] bg-border -rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to bag Action Button (Theme-aligned acid green look) */}
          <div className="space-y-4 pt-4">
            <button
              disabled={product.stock === 0 || cartLoading}
              onClick={handleAddToCart}
              className="w-full group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-primary hover:opacity-90 disabled:opacity-30 active:scale-98 shadow-xl py-4.5 text-black transition-all"
            >
              {cartLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-black" />
              ) : (
                <>
                  <ShoppingBag className="h-4.5 w-4.5 text-black" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black">
                    {product.stock === 0 ? 'Out of Stock' : 'ADD TO BAG'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3.5 text-[9px] font-black uppercase tracking-widest text-app-text/40 py-2">
              <Clock className="h-4 w-4 text-brand-primary shrink-0" />
              Easy 10-day return and exchange on this product. No questions asked.
            </div>
          </div>

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
                className="rounded-xl border border-app-text bg-app-text px-6 text-[10px] font-black uppercase tracking-wider text-black hover:opacity-90 active:scale-95 transition-all"
              >
                {checkingPincode ? 'Checking...' : 'CHECK'}
              </button>
            </form>
            {deliveryStatus && (
              <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> {deliveryStatus.message}
              </p>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Trust Badges Section */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: '100% Genuine', text: 'Authentic products' },
              { icon: ShoppingBag, label: 'Easy Returns', text: '10-Day Policy' },
              { icon: Sparkles, label: 'Quality Check', text: '2-Level verified' },
              { icon: Shield, label: 'Secure Pay', text: 'SSL Encrypted' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-app-panel/50">
                <div className="h-8 w-8 rounded-lg bg-app-text flex items-center justify-center text-brand-primary shrink-0">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-app-text leading-tight">{item.label}</p>
                  <p className="text-[8px] font-bold text-app-text/40 uppercase tracking-tight mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lookalike Products Section */}
      {lookalikeProducts.length > 0 && (
        <div className="pt-16 space-y-8 border-t border-border">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Handpicked for you</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-app-text">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {lookalikeProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Similar Clothes Section */}
      {similarClothes.length > 0 && (
        <div className="pt-16 space-y-8 border-t border-border">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Style it up</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-app-text">Complete Your Look</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {similarClothes.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal Popup */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] rounded-[2rem] border border-border p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setShowSizeGuide(false)} 
              className="absolute top-5 right-5 text-app-text/60 hover:text-app-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-black uppercase tracking-wider text-app-text mb-4">
              Size Guide ({isFootwear ? 'Footwear' : 'Clothing'})
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
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 6</td><td className="py-2.5">25.1 cm</td><td className="py-2.5">US 7</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 7</td><td className="py-2.5">25.9 cm</td><td className="py-2.5">US 8</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 8</td><td className="py-2.5">26.8 cm</td><td className="py-2.5">US 9</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 9</td><td className="py-2.5">27.6 cm</td><td className="py-2.5">US 10</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 10</td><td className="py-2.5">28.4 cm</td><td className="py-2.5">US 11</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">UK 11</td><td className="py-2.5">29.3 cm</td><td className="py-2.5">US 12</td></tr>
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
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">S</td><td className="py-2.5">42 in</td><td className="py-2.5">28 in</td><td className="py-2.5">24.5 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">M</td><td className="py-2.5">44 in</td><td className="py-2.5">29 in</td><td className="py-2.5">25 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">L</td><td className="py-2.5">46 in</td><td className="py-2.5">30 in</td><td className="py-2.5">25.5 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">XL</td><td className="py-2.5">48 in</td><td className="py-2.5">31 in</td><td className="py-2.5">26 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">2XL</td><td className="py-2.5">50 in</td><td className="py-2.5">31.5 in</td><td className="py-2.5">26.5 in</td></tr>
                  <tr className="border-b border-border"><td className="py-2.5 font-bold">3XL</td><td className="py-2.5">52 in</td><td className="py-2.5">32 in</td><td className="py-2.5">27 in</td></tr>
                </tbody>
              </table>
            )}
            <button 
              onClick={() => setShowSizeGuide(false)}
              className="mt-6 w-full py-3 bg-app-text text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Close Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
