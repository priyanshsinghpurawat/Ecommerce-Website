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
          if (prod.colors?.length > 0) {
            setSelectedColor(prod.colors[0].name);
          }
          const isFoot = prod.category?.name?.toLowerCase() === 'footwear' || prod.subcategory?.name?.toLowerCase().includes('shoes') || prod.subcategory?.name?.toLowerCase().includes('sneakers');
          setSelectedSize(isFoot ? 'UK 8' : 'S');

          // Fetch Lookalike Products (Same subcategory)
          if (prod.subcategory?._id) {
            const lookalikeRes = await getProducts({ subcategory: prod.subcategory._id, limit: 6 });
            const filteredLookalikes = (lookalikeRes?.data?.products || []).filter(p => p._id !== id);
            setLookalikeProducts(filteredLookalikes);
          }

          // Fetch Similar Clothes (Different subcategory/category)
          const subcategoryId = prod.subcategory?._id;
          const similarRes = await getProducts({ limit: 12 });
          const allOtherProds = (similarRes?.data?.products || []).filter(p => p._id !== id);
          
          // Filter products that belong to a different subcategory
          const filteredSimilar = allOtherProds.filter(p => p.subcategory?._id !== subcategoryId).slice(0, 6);
          setSimilarClothes(filteredSimilar);
        }
      } catch (err) {
        toast.error('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon ${code} copied!`);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      toast.error('Please enter a valid 6-digit pincode.');
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

  if (loading || !product) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lux-dark/45" />
      </div>
    );
  }

  const hasDiscount = product.discountedPrice !== null && product.discountedPrice !== undefined;
  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const isFootwear = product.category?.name?.toLowerCase() === 'footwear' || 
                      product.subcategory?.name?.toLowerCase().includes('shoes') || 
                      product.subcategory?.name?.toLowerCase().includes('sneakers');

  const sizeOptions = isFootwear ? ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'] : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const outOfStockSizes = isFootwear ? ['UK 11'] : ['4XL', '5XL'];

  const currentMeasure = isFootwear 
    ? FOOTWEAR_MEASUREMENTS[selectedSize] 
    : CLOTHING_MEASUREMENTS[selectedSize];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <Link
        to="/shop"
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-lux-dark/40 hover:text-lux-dark transition-colors"
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
                      ? 'border-lux-primary scale-102 shadow-lg shadow-lux-primary/5' 
                      : 'border-border-base hover:border-lux-dark/50'
                  }`}
                >
                  <img src={resolveImageUrl(img, 200)} className="h-full w-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Product Image */}
          <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-lux-card border border-border-base group">
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
            <h1 className="text-3xl font-black uppercase tracking-tight text-lux-dark leading-[1.0]">
              {product.title}
            </h1>
            
            <p className="text-[11px] font-bold text-lux-dark/40 uppercase tracking-widest">
              SKU: {product._id ? `${product._id.slice(-7).toUpperCase()}-${selectedSize}` : '1547921-S'}
            </p>

            <div className="flex items-baseline gap-4 pt-2">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-black tracking-tighter text-lux-dark">
                    ₹{product.discountedPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-lg font-bold text-lux-dark/30 line-through tracking-tighter">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
                    -{getDiscountPercent(product.price, product.discountedPrice)}% Off
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black tracking-tighter text-lux-dark">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            
            <p className="text-[10px] font-bold text-lux-dark/45 uppercase">Tax included.</p>
          </div>

          <div className="h-px bg-lux-100" />

          {/* Best Offers Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-lux-dark">Best Offers for you:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => handleCopyCoupon('EOS515')}
                className="border border-dashed border-lux-200 bg-lux-50/50 p-4 rounded-xl cursor-pointer hover:border-lux-primary/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <p className="text-[10px] font-black text-lux-dark">Get this for <span className="text-lux-primary">₹{(product.discountedPrice || product.price) - 150}</span></p>
                  <p className="text-[9px] font-bold text-lux-dark/40 uppercase mt-0.5">Buy 2 Get 15% Off*</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-lux-100 pt-2 text-[9px] font-black uppercase">
                  <span className="text-lux-dark/50">Code: <span className="text-lux-dark underline">EOS515</span></span>
                  <span className="text-lux-primary group-hover:scale-105 transition-transform">Copy</span>
                </div>
              </div>

              <div 
                onClick={() => handleCopyCoupon('EOS30')}
                className="border border-dashed border-lux-200 bg-lux-50/50 p-4 rounded-xl cursor-pointer hover:border-lux-primary/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <p className="text-[10px] font-black text-lux-dark">Get this for <span className="text-lux-primary">₹{(product.discountedPrice || product.price) - 300}</span></p>
                  <p className="text-[9px] font-bold text-lux-dark/40 uppercase mt-0.5">Buy 3 Get 30% Off*</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-lux-100 pt-2 text-[9px] font-black uppercase">
                  <span className="text-lux-dark/50">Code: <span className="text-lux-dark underline">EOS30</span></span>
                  <span className="text-lux-primary group-hover:scale-105 transition-transform">Copy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-lux-100" />

          {/* Sizing Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-lux-dark">
                Size: {selectedSize}
              </h3>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="text-[10px] font-black uppercase tracking-wider text-lux-dark/45 hover:text-lux-primary underline decoration-dotted"
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
                        ? 'border-lux-dark bg-lux-dark text-black'
                        : isOutOfStock
                          ? 'border-lux-100 bg-lux-50/30 text-lux-dark/20 cursor-not-allowed lines-out'
                          : 'border-lux-200 bg-lux-50 hover:border-lux-dark text-lux-dark'
                    }`}
                  >
                    {size}
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-full h-[1px] bg-lux-200 rotate-45" />
                        <span className="w-full h-[1px] bg-lux-200 -rotate-45" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add to bag Action Button (custom dark brown color) */}
          <div className="space-y-4 pt-4">
            <button
              disabled={product.stock === 0 || cartLoading}
              onClick={handleAddToCart}
              style={{ backgroundColor: '#3e3a35' }}
              className="w-full group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl py-4.5 transition-opacity hover:opacity-95 disabled:opacity-30 active:scale-98 shadow-xl text-white"
            >
              {cartLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <>
                  <ShoppingBag className="h-4.5 w-4.5 text-white" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    {product.stock === 0 ? 'Out of Stock' : 'ADD TO CART'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3.5 text-[9px] font-black uppercase tracking-widest text-lux-dark/40 py-2">
              <Clock className="h-4 w-4 text-lux-primary shrink-0" />
              Easy 10-day return and exchange on this product. No questions asked.
            </div>
          </div>

          <div className="h-px bg-lux-100" />

          {/* Check Delivery pincode check */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-lux-dark">Check Delivery:</h4>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 rounded-xl border border-lux-200 bg-lux-50 px-4 py-2 text-xs font-sans focus:outline-none focus:border-lux-primary"
              />
              <button 
                type="submit"
                disabled={checkingPincode}
                className="rounded-xl border border-lux-dark bg-lux-dark px-6 text-[10px] font-black uppercase tracking-wider text-black hover:opacity-90 active:scale-95 transition-all"
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
        </div>
      </div>

      {/* Lookalike Products Section */}
      {lookalikeProducts.length > 0 && (
        <div className="pt-16 space-y-8 border-t border-lux-100">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-lux-primary italic">Handpicked alternatives</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-lux-dark">Lookalike Products</h2>
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
        <div className="pt-16 space-y-8 border-t border-lux-100">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-lux-primary italic">Style suggestions</p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-lux-dark">Similar Clothes</h2>
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
          <div className="bg-white dark:bg-[#121212] rounded-[2rem] border border-lux-100 p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setShowSizeGuide(false)} 
              className="absolute top-5 right-5 text-lux-dark/60 hover:text-lux-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-black uppercase tracking-wider text-lux-dark mb-4">
              Size Guide ({isFootwear ? 'Footwear' : 'Clothing'})
            </h3>
            
            {isFootwear ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-lux-100 text-[10px] font-black uppercase text-lux-dark/45">
                    <th className="py-2.5">UK Size</th>
                    <th className="py-2.5">Foot Length</th>
                    <th className="py-2.5">US Size</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-lux-dark/75">
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 6</td><td className="py-2.5">25.1 cm</td><td className="py-2.5">US 7</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 7</td><td className="py-2.5">25.9 cm</td><td className="py-2.5">US 8</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 8</td><td className="py-2.5">26.8 cm</td><td className="py-2.5">US 9</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 9</td><td className="py-2.5">27.6 cm</td><td className="py-2.5">US 10</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 10</td><td className="py-2.5">28.4 cm</td><td className="py-2.5">US 11</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">UK 11</td><td className="py-2.5">29.3 cm</td><td className="py-2.5">US 12</td></tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-lux-100 text-[10px] font-black uppercase text-lux-dark/45">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Chest</th>
                    <th className="py-2.5">Length</th>
                    <th className="py-2.5">Sleeve</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-lux-dark/75">
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">S</td><td className="py-2.5">42 in</td><td className="py-2.5">28 in</td><td className="py-2.5">24.5 in</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">M</td><td className="py-2.5">44 in</td><td className="py-2.5">29 in</td><td className="py-2.5">25 in</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">L</td><td className="py-2.5">46 in</td><td className="py-2.5">30 in</td><td className="py-2.5">25.5 in</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">XL</td><td className="py-2.5">48 in</td><td className="py-2.5">31 in</td><td className="py-2.5">26 in</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">2XL</td><td className="py-2.5">50 in</td><td className="py-2.5">31.5 in</td><td className="py-2.5">26.5 in</td></tr>
                  <tr className="border-b border-lux-100"><td className="py-2.5 font-bold">3XL</td><td className="py-2.5">52 in</td><td className="py-2.5">32 in</td><td className="py-2.5">27 in</td></tr>
                </tbody>
              </table>
            )}
            <button 
              onClick={() => setShowSizeGuide(false)}
              className="mt-6 w-full py-3 bg-lux-dark text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Close Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
