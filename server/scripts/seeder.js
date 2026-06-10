import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';

dotenv.config();

const catalog = [
  {
    category: 'Clothing',
    subcategories: ['T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Streetwear', 'Linen', 'cargo'],
    products: [
      {
        sub: 'T-Shirts',
        title: 'Essential White Oversized Tee',
        desc: 'Premium 240 GSM heavy cotton with a relaxed drop-shoulder fit. The ultimate street-style basic.',
        price: 1499,
        sale: 999,
        stock: 50,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780560349/Screenshot_4-6-2026_133356_in.puma.com_znzchb.jpg',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780560349/Screenshot_4-6-2026_133410_in.puma.com_h6ffoz.jpg'],
        badge: 'new-arrival',
        rating: 4.8,
        reviews: 120,
        variants: [{ size: 'S', color: 'White', stock: 15, sku: 'TS-WHT-S' }]
      },
      {
        sub: 'T-Shirts',
        title: 'Midnight Black Graphic Tee',
        desc: 'Soft-touch combed cotton with high-density screen print on the back.',
        price: 1699,
        sale: 1299,
        stock: 40,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074036/1713961601_3287348_z7rvi9.avif',
        rating: 4.5,
        reviews: 85,
        variants: [{ size: 'M', color: 'Black', stock: 20, sku: 'TS-BLK-M' }]
      },
      {
        sub: 'Shirts',
        title: 'Linen Resort Shirt — Sage',
        desc: 'Breathable linen-cotton blend. Perfect for summer days and vacation vibes.',
        price: 2499,
        sale: 1899,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073624/1731995063_3156808_i9pamp.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073633/1731995063_5853795_lndv5i.avif'],
        badge: 'sale',
        rating: 4.2,
        reviews: 45,
        variants: [{ size: 'L', color: 'Sage', stock: 10, sku: 'SH-SGE-L' }]
      },
      {
        sub: 'Shirts',
        title: 'Cotton Linen: Light Mauve',
        desc: 'Cotton Linen Shirts versatile enough for work or casual settings.',
        price: 2899,
        stock: 35,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073624/1731995063_3156808_i9pamp.avif',
        rating: 4.7,
        reviews: 60,
        variants: [{ size: 'M', color: 'Blue', stock: 15, sku: 'SH-OX-BLU' }]
      },
      {
        sub: 'Pants',
        title: 'Chino Slim Trousers',
        desc: 'Stretch cotton-twill chinos in a modern slim fit.',
        price: 2299,
        sale: 1999,
        stock: 35,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078161/1776160930_1162861_q03uav.avif',
        rating: 4.4,
        reviews: 92,
        variants: [{ size: '32', color: 'Khaki', stock: 20, sku: 'PN-CH-KH' }]
      },
      {
        sub: 'Pants',
        title: 'Formal office wear pants',
        desc: 'formal office wear pants.',
        price: 3299,
        sale: 1999,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780299542/Limario_Rio_rgiqom.jpg',
        img2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780299541/download_l2tlc4.jpg',
        badge: 'limited-edition',
        rating: 4.6,
        reviews: 110,
        variants: [{ size: '32', color: 'Blue', stock: 15, sku: 'PN-DN-BLU' }]
      },
      {
        sub: 'Jeans',
        title: 'Black Slim Denim',
        desc: 'Clean, versatile black denim, essential for any wardrobe.',
        price: 2999,
        sale: 0,
        stock: 40,
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800',
        rating: 4.5,
        reviews: 75,
        variants: [{ size: '34', color: 'Black', stock: 20, sku: 'PN-DN-BLK' }]
      },
      {
        sub: 'Streetwear',
        title: 'Urban Utility Cargo Pants',
        desc: 'Multi-pocket design with reinforced stitching.',
        price: 3499,
        sale: 2799,
        stock: 25,
        img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800',
        badge: 'street-drip',
        rating: 4.9,
        reviews: 150,
        variants: [{ size: '32', color: 'Black', stock: 10, sku: 'PN-CRG-BLK' }]
      },
      {
        sub: 'Shirts',
        title: 'Vintage Plaid Overshirt',
        desc: 'Classic vintage plaid pattern, soft cotton blend, oversized fit.',
        price: 2499,
        sale: 1999,
        stock: 20,
        img: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=800',
        badge: 'street-drip',
        rating: 4.6,
        reviews: 25,
        variants: [{ size: 'L', color: 'Blue Check', stock: 10, sku: 'SH-VPO-BLU' }]
      },
      {
        sub: 'Streetwear',
        title: 'Neon Stitch Utility Vest',
        desc: 'Water-resistant tactical vest with neon accents.',
        price: 2999,
        sale: 1799,
        stock: 15,
        img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800',
        badge: 'limited-edition',
        rating: 4.8,
        reviews: 40,
        variants: [{ size: 'M', color: 'Neon Black', stock: 8, sku: 'VT-NST-M' }]
      },
      {
        sub: 'Linen',
        title: 'Premium Pink Linen Shirt',
        desc: 'Relaxed fit, pure organic linen shirt. Light, breathable, and styled for effortless summer comfort.',
        price: 2999,
        sale: 1999,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074252/lightpink_e3zhzx.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074253/1779703404_2796734_h243zv.avif'],
        badge: 'new-arrival',
        variants: [
          { size: 'M', color: 'Pink', stock: 15, sku: 'LN-PNK-M' },
          { size: 'L', color: 'Pink', stock: 15, sku: 'LN-PNK-L' }
        ]
      },
      {
        sub: 'Streetwear',
        title: 'Oversized Acid Wash Tee',
        desc: 'Vintage acid wash finish with drop shoulders and a heavy vintage feel.',
        price: 1999,
        sale: 1499,
        stock: 45,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074257/ac_t3islz.avif',
        extraImgs: [
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074255/acidgreen_axuirf.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/i_v9qslc.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/acid_ixbr2q.avif',
        ],
        badge: 'street-drip',
        rating: 4.7,
        reviews: 58,
        variants: [{ size: 'L', color: 'Grey', stock: 15, sku: 'SW-AW-GRY' }]
      },
      {
        sub: 'Streetwear',
        title: 'Cyberpunk Tech Jacket',
        desc: 'Reflective panels and waterproof fabric. Built for the dystopian streets.',
        price: 5999,
        sale: 4499,
        stock: 12,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078662/1772696574_8564664_zzldxf.avif',
        img2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078679/1772279583_4098767_hezzsd.avif',
        img3: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078664/1772279583_3693413_i9ome5.avif',
        img4: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078662/1772696574_8564664_zzldxf.avif',
        badge: 'street-drip',
        rating: 4.9,
        reviews: 24,
        variants: [{ size: 'M', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB' }]
      },
      {
        sub: 'Linen',
        title: 'Classic White Linen Shirt',
        desc: 'Tailored from premium breathable linen. Easy regular fit with classic collar.',
        price: 2799,
        sale: 1899,
        stock: 25,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984919/mensvibe/products/1739601040_8064076.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984921/mensvibe/products/1739601040_1918057.avif'],
        badge: 'limited-edition',
        variants: [
          { size: 'M', color: 'White', stock: 15, sku: 'LN-WHT-M' },
          { size: 'L', color: 'White', stock: 10, sku: 'LN-WHT-L' }
        ]
      },
      {
        _id: '6a27ed6aad7d78cd89ec2266',
        sub: 'Shirts',
        title: 'Vintage Plaid Overshirt',
        desc: 'Classic vintage plaid pattern, soft cotton blend, oversized fit.',
        price: 999.01,
        sale: 0,
        stock: 10,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/v1781001456/mensvibe/products/1764660274_2193914.avif',
        extraImgs: [
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781001456/mensvibe/products/1764660274_2193914.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781001457/mensvibe/products/1764057049_4505939.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781001455/mensvibe/products/1736491521_4978820.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781001456/mensvibe/products/1736491521_4981170.avif'
        ],
        badge: 'street-drip',
        rating: 4.6,
        reviews: 25,
        variants: []
      },
      {
        _id: '6a27ebfaad7d78cd89ec2128',
        sub: 'T-Shirts',
        title: 'superman vintage black T-shirt',
        desc: 'genz t shirt',
        price: 999,
        sale: 0,
        stock: 10,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/v1780995557/mensvibe/products/Supermanvintage.avif',
        extraImgs: [
          'https://res.cloudinary.com/decppyzuk/image/upload/v1780995557/mensvibe/products/Supermanvintage.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1780995556/mensvibe/products/1746297227_6892711.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1780995556/mensvibe/products/1762941550_7886104.avif'
        ],
        badge: 'street-drip',
        rating: 4.8,
        reviews: 120,
        variants: []
      },
      {
        _id: '6a27e842ad7d78cd89ec1f43',
        sub: 'cargo',
        title: 'Dark Grey Men Cargo',
        desc: 'Pants Material & Care: 98% Cotton 2% Elastane Machine Wash Multi-pocket design with reinforced stitching.',
        price: 900,
        sale: 0,
        stock: 10,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/v1781000255/mensvibe/products/1757075251_6209198.avif',
        extraImgs: [
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781000255/mensvibe/products/1757075251_6209198.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/v1781000257/mensvibe/products/1757075251_7195043.avif'
        ],
        badge: 'street-drip',
        rating: 4.9,
        reviews: 150,
        variants: [
          {
            color: 'Grey',
            size: '32',
            sku: 'PN-CRG-GRY-32',
            stock: 10,
            price: 900,
            images: [
              'https://res.cloudinary.com/decppyzuk/image/upload/v1781000255/mensvibe/products/1757075251_6209198.avif'
            ]
          }
        ]
      }
    ]
  },
  {
    category: 'Footwear',
    subcategories: ['Sneakers', 'Boots', 'Sports'],
    products: [
      {
        sub: 'Sneakers',
        title: 'Retro Court Sneakers',
        desc: 'Genuine leather upper with a classic silhouette. Timeless appeal.',
        price: 5499,
        sale: 4499,
        stock: 15,
        img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=2000&auto=format&fit=crop',
        variants: [
          { size: '8', color: 'White', stock: 5, sku: 'SK-WHT-8' },
          { size: '9', color: 'White', stock: 5, sku: 'SK-WHT-9' },
          { size: '10', color: 'White', stock: 5, sku: 'SK-WHT-10' }
        ]
      }
    ]
  }
];

const couponsData = [
  { code: 'MENSVIBE10', discountType: 'percentage', discountValue: 10, minCartAmount: 499, isActive: true },
  { code: 'FIT100', discountType: 'flat', discountValue: 100, minCartAmount: 999, isActive: true }
];

/**
 * THE MAIN SEED FUNCTION
 * This is the engine that actually talks to MongoDB.
 */
const seed = async () => {
  try {
    // 1. Connect to the Database (Local or Production)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    // 2. CLEAR THE SLATE
    // We delete EVERYTHING first so we don't get duplicate data errors.
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Subcategory.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // 3. CREATE USERS
    // We create one of each role (Admin, Seller, Regular User)
    console.log('Creating demo users...');
    await User.create({
      name: 'Vibe Admin',
      email: 'admin@mensvibe.in',
      password: 'adminpassword',
      role: 'admin',
      // ... rest of admin data ...
      avatar: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780309000/dp_hero_casual_mpyrys.png',
      addresses: [{
        fullName: 'Vibe Admin',
        phone: '9876543210',
        street: 'Main Street 1',
        city: 'Jaipur',
        state: 'Rajasthan',
        zipCode: '302001',
        country: 'India',
        isDefault: true
      }]
    });

    const sellerUser = await User.create({
      name: 'Vibe Seller',
      brandName: 'MensVibe Originals',
      email: 'seller@mensvibe.in',
      password: 'sellerpassword',
      role: 'seller',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
      addresses: [{
        fullName: 'MensVibe Originals',
        phone: '9876543211',
        street: 'Market Road 10',
        city: 'Jaipur',
        state: 'Rajasthan',
        zipCode: '302005',
        country: 'India',
        isDefault: true
      }]
    });

    const nikeSeller = await User.create({
      name: 'Nike India',
      brandName: 'Nike Authorized',
      email: 'nike@mensvibe.in',
      password: 'sellerpassword',
      role: 'seller',
      avatar: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780309000/dp_hero_casual_mpyrys.png',
      addresses: [{
        fullName: 'Nike Authorized',
        phone: '9876543212',
        street: 'Connaught Place',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India',
        isDefault: true
      }]
    });

    await User.create({
      name: 'Regular Customer',
      email: 'demo@mensvibe.in',
      password: 'demopassword',
      role: 'user',
      avatar: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1779082514/samples/people/boy-snow-hoodie.jpg',
      addresses: [{
        fullName: 'Regular Customer',
        phone: '9876543213',
        street: 'Customer Lane 5',
        city: 'Jaipur',
        state: 'Rajasthan',
        zipCode: '302012',
        country: 'India',
        isDefault: true
      }]
    });

    const subIds = {};

    for (const block of catalog) {
      const cat = await Category.create({ name: block.category });

      for (const subName of block.subcategories) {
        const sub = await Subcategory.create({ name: subName, category: cat._id });
        subIds[`${block.category}:${subName}`] = sub._id;
      }

      for (const p of block.products) {
        await Product.create({
          _id: p._id || undefined,
          title: p.title,
          description: p.desc,
          price: p.price,
          discountedPrice: p.sale > 0 ? p.sale : null,
          stock: p.stock,
          image: p.img || undefined,
          images: p.extraImgs || [],
          variants: p.variants || [],
          category: cat._id,
          subcategory: subIds[`${block.category}:${p.sub}`],
          seller: block.category === 'Footwear' ? nikeSeller._id : sellerUser._id,
          gender: 'men',
          badge: p.badge || '',
          rating: p.rating ?? 0,
          reviewCount: p.reviews ?? 0
        });
      }
    }

    for (const c of couponsData) {
      await Coupon.create(c);
    }

    const productCount = await Product.countDocuments();
    const subCount = await Subcategory.countDocuments();
    const catCount = await Category.countDocuments();

    console.log('--- MensVibe seed complete ---');
    console.log(`Categories: ${catCount} | Subcategories: ${subCount} | Products: ${productCount}`);
    console.log('Admin: admin@mensvibe.in / adminpassword');
    console.log('Seller: seller@mensvibe.in / sellerpassword');
    console.log('User:  demo@mensvibe.in / demopassword');
    console.log('Coupons: MENSVIBE10, FIT100');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
