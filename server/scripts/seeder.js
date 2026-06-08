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
    subcategories: [
      'T-Shirts',
      'Shirts',
      'Pants',
      'Jeans',
      'Shorts',
      'Hoodies',
      'Sportswear',
      'Track Pants',
      'Streetwear'
    ],
    products: [
      { sub: 'Streetwear', title: 'Graffiti Oversized Hoodie', desc: 'Hand-painted effect, ultra-heavy fleece.', price: 3499, sale: 2799, stock: 15, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974&auto=format&fit=crop', badge: 'street-drip' },
      { sub: 'Streetwear', title: 'Cyberpunk Cargo Joggers', desc: 'Multi-strap utility, tech-wear aesthetic.', price: 2999, sale: 2299, stock: 20, img: 'mens_pants.png', badge: 'street-drip' },
      { sub: 'Streetwear', title: 'Neon Stitch Utility Vest', desc: 'Reflective details, 4-pocket layout.', price: 1899, sale: 1499, stock: 12, img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2072&auto=format&fit=crop', badge: 'street-drip' },
      { sub: 'Streetwear', title: 'Distressed Patchwork Jeans', desc: 'Raw hems, custom distressing.', price: 2499, sale: 1999, stock: 18, img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop', badge: 'street-drip' },
      { sub: 'T-Shirts', title: 'Oversized Graphic Tee — Black', desc: '240 GSM cotton, relaxed fit.', price: 599, sale: 449, stock: 40, img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'T-Shirts', title: 'Striped Polo — Navy', desc: 'Breathable pique knit.', price: 799, sale: 649, stock: 30, img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=2030&auto=format&fit=crop' },
      { sub: 'T-Shirts', title: 'Minimal Logo Tee — White', desc: 'Soft combed cotton, regular fit.', price: 499, sale: 399, stock: 55, img: 'mens_shirt.png' },
      { sub: 'T-Shirts', title: 'Tie-Dye Street Tee — Blue', desc: 'Vibrant wash, dropped shoulders.', price: 699, sale: 549, stock: 28, img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1914&auto=format&fit=crop' },
      { sub: 'T-Shirts', title: 'Vintage Oversized Tee', desc: 'Heavyweight cotton, vintage wash.', price: 1299, sale: 899, stock: 15, img: 'andres-jasso-PqbL_mxmaUE-unsplash.jpg', badge: 'new-arrival' },
      { sub: 'Shirts', title: 'Cuban Collar Shirt — blue', desc: 'Lightweight linen blend.', price: 999, sale: 0, stock: 25, img: 'blue cuban collar shirt.png', extraImgs: ['blue shirt back.png'] },
      { sub: 'Shirts', title: 'Oxford Button-Down — Sky', desc: 'Crisp weave, campus-ready.', price: 1899, sale: 1749, stock: 9000, img: 'Pleated suit.jpg' },
      { sub: 'Shirts', title: 'Linen Resort Shirt — Beige', desc: 'Airflow weave for summer.', price: 1099, sale: 899, stock: 20, img: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=2070&auto=format&fit=crop' },
      { sub: 'Shirts', title: 'Multicolour Printed Checks Shirt', desc: 'Relaxed drop shoulder plaid flannel checks shirt in olive, rust & cream pattern. Crafted from premium breathable cotton, styled with dual utility chest pockets.', price: 2799, sale: 1199, stock: 28, badge: 'street-drip', rating: 4.7, reviews: 21, img: 'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1974&auto=format&fit=crop', extraImgs: [
        'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1974&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1970&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1976&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1974&auto=format&fit=crop'
      ] },
      { sub: 'Shirts', title: 'Charcoal Black Checks Structured Shirt', desc: 'Bold block checks, structured collar. Layer over a white tee.', price: 2199, sale: 1199, stock: 22, badge: 'new-arrival', rating: 4.9, reviews: 15, img: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'Shirts', title: 'Mustard Brushed Checks Shirt', desc: 'Soft brushed flannel in mustard & black grid.', price: 2199, sale: 999, stock: 30, badge: 'sale', rating: 4.9, reviews: 16, img: 'https://images.unsplash.com/photo-1611312449412-6cefac56399c?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'Pants', title: 'Tailored Chino — Tan', desc: 'Slim taper, stretch waist.', price: 1199, sale: 999, stock: 35, img: 'mens_pants.png' },
      { sub: 'Pants', title: 'Pleated Dress Pant — Charcoal', desc: 'Clean drape, school-formal ready.', price: 1399, sale: 1149, stock: 22, img: 'Pleated Dress Pant.jpg', badge: 'new-arrival', rating: 4.7, reviews: 21 },
      { sub: 'Jeans', title: 'Slim Stretch Jeans — Indigo', desc: '2% elastane comfort.', price: 1299, sale: 999, stock: 35, img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop' },
      { sub: 'Shorts', title: 'Cargo Shorts — Khaki', desc: '6-pocket utility fit.', price: 899, sale: 699, stock: 32, img: 'tuananh-blue-xa8hkIGTTf8-unsplash.jpg' },
      { sub: 'Hoodies', title: 'Zip-Up Hoodie — Charcoal', desc: 'Fleece-lined street essential.', price: 1499, sale: 1199, stock: 28, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'Sportswear', title: 'Dry-Fit Training Tee — Red', desc: 'Moisture-wick mesh panels.', price: 649, sale: 499, stock: 45, img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'Track Pants', title: 'Tapered Track Pant — Navy', desc: 'Zip pockets, rib cuffs.', price: 999, sale: 799, stock: 36, img: 'https://images.unsplash.com/photo-1580902311832-514f07ad33c8?q=80&w=1974&auto=format&fit=crop' }
    ]
  },
  {
    category: 'Footwear',
    subcategories: ['Sneakers', 'Sports Shoes', 'Casual Shoes', 'Sandals', 'Slippers'],
    products: [
      { sub: 'Sneakers', title: 'Street Runner — White/Red', desc: 'Mesh upper, EVA cushion.', price: 1999, sale: 1599, stock: 22, img: 'mens_sneakers.png' },
      { sub: 'Sneakers', title: 'High-Top Sneaker — Black', desc: 'Ankle support, vulcanized sole.', price: 2499, sale: 1999, stock: 18, img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop' },
      { sub: 'Sneakers', title: 'Chunky Dad Sneaker — Grey', desc: 'Bold sole, everyday flex.', price: 2199, sale: 1799, stock: 20, img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop' },
      { sub: 'Sports Shoes', title: 'Running Shoe — Volt', desc: 'Lightweight, responsive foam.', price: 2799, sale: 2299, stock: 16, img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=2071&auto=format&fit=crop' },
      { sub: 'Slippers', title: 'Home Flip-Flop — Grey', desc: 'Soft rubber, ergonomic strap.', price: 299, sale: 249, stock: 60, img: 'home_flipflop_grey.png' }

    ]
  }
];

const couponsData = [
  { code: 'MENSVIBE10', discountType: 'percentage', discountValue: 10, minCartAmount: 499, isActive: true },
  { code: 'FIT100', discountType: 'flat', discountValue: 100, minCartAmount: 999, isActive: true }
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Subcategory.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    await User.create({
      name: 'Vibe Admin',
      email: 'admin@mensvibe.in',
      password: 'adminpassword',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop',
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
      avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
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
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop',
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
          title: p.title,
          description: p.desc,
          price: p.price,
          discountedPrice: p.sale > 0 ? p.sale : null,
          stock: p.stock,
          image: p.img,
          images: p.extraImgs || [],
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
