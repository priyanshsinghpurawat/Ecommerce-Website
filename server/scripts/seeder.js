import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Papa from 'papaparse';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';

dotenv.config();

/* -------------------------------------------------------------------------- */
/*                                STATIC CATALOG                               */
/* -------------------------------------------------------------------------- */
const catalog = [
  {
    category: 'Clothing',
    subcategories: ['T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Streetwear', 'Linen', 'cargo'],
    products: [
      {
        sub: 'Streetwear',
        title: 'Premium Blue Check Shirt',
        desc: 'Blue check shirt with wide pattern for streetwear, tailored with +2.5 inches torso and sleeve length for heights 6\'0" to 6\'5".',
        price: 2599,
        sale: 1299,
        stock: 10000,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781002947/mensvibe/products/bluecheckcloth.avif',
        badge: 'limited-edition',
        rating: 0,
        reviews: 0,
        variants: [
          { size: 'MT', color: 'Blue Check', stock: 50, sku: 'SH-BLU-MT' },
          { size: 'LT', color: 'Blue Check', stock: 100, sku: 'SH-BLU-LT' },
          { size: 'XLT', color: 'Blue Check', stock: 150, sku: 'SH-BLU-XLT' },
          { size: '2XLT', color: 'Blue Check', stock: 100, sku: 'SH-BLU-2XLT' },
          { size: '3XLT', color: 'Blue Check', stock: 50, sku: 'SH-BLU-3XLT' }
        ]
      },
      {
        sub: 'T-Shirts',
        title: 'Essential White Oversized Tee',
        desc: 'Premium 240 GSM heavy cotton with a relaxed drop-shoulder fit. Specifically tailored with extra torso length for tall frames 6\'0" to 6\'5".',
        price: 1499,
        sale: 999,
        stock: 50,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780560349/Screenshot_4-6-2026_133356_in.puma.com_znzchb.jpg',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780560349/Screenshot_4-6-2026_133410_in.puma.com_h6ffoz.jpg'],
        badge: 'new-arrival',
        rating: 4.8,
        reviews: 120,
        variants: [
          { size: 'MT', color: 'White', stock: 15, sku: 'TS-WHT-MT' },
          { size: 'LT', color: 'White', stock: 15, sku: 'TS-WHT-LT' },
          { size: 'XLT', color: 'White', stock: 20, sku: 'TS-WHT-XLT' },
          { size: '2XLT', color: 'White', stock: 25, sku: 'TS-WHT-2XLT' },
          { size: '3XLT', color: 'White', stock: 20, sku: 'TS-WHT-3XLT' }
        ]
      },
      {
        sub: 'T-Shirts',
        title: 'Midnight Black Graphic Tee',
        desc: 'Soft-touch combed cotton with high-density screen print on the back. Tall-engineered fit ensures it stays tucked or hangs perfectly for 6\'0" to 6\'5" heights.',
        price: 1699,
        sale: 1299,
        stock: 40,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074036/1713961601_3287348_z7rvi9.avif',
        rating: 4.5,
        reviews: 85,
        variants: [
          { size: 'MT', color: 'Black', stock: 15, sku: 'TS-BLK-MT' },
          { size: 'LT', color: 'Black', stock: 15, sku: 'TS-BLK-LT' },
          { size: 'XLT', color: 'Black', stock: 20, sku: 'TS-BLK-XLT' },
          { size: '2XLT', color: 'Black', stock: 25, sku: 'TS-BLK-2XLT' },
          { size: '3XLT', color: 'Black', stock: 20, sku: 'TS-BLK-3XLT' }
        ]
      },
      {
        sub: 'Shirts',
        title: 'Linen Resort Shirt — Sage',
        desc: 'Breathable linen-cotton blend. Perfect for summer days, with longer arms and torso specifically for heights 6\'0" to 6\'5".',
        price: 2499,
        sale: 1899,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073624/1731995063_3156808_i9pamp.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073633/1731995063_5853795_lndv5i.avif'],
        badge: 'sale',
        rating: 4.2,
        reviews: 45,
        variants: [
          { size: 'MT', color: 'Sage', stock: 10, sku: 'SH-SGE-MT' },
          { size: 'LT', color: 'Sage', stock: 10, sku: 'SH-SGE-LT' },
          { size: 'XLT', color: 'Sage', stock: 15, sku: 'SH-SGE-XLT' },
          { size: '2XLT', color: 'Sage', stock: 10, sku: 'SH-SGE-2XLT' },
          { size: '3XLT', color: 'Sage', stock: 15, sku: 'SH-SGE-3XLT' }
        ]
      },
      {
        sub: 'Shirts',
        title: 'Cotton Linen: Light Mauve',
        desc: 'Cotton Linen Shirts versatile enough for work or casual settings, cut with extra length to fit taller profiles 6\'0" to 6\'5".',
        price: 2899,
        stock: 35,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781073624/1731995063_3156808_i9pamp.avif',
        rating: 4.7,
        reviews: 60,
        variants: [
          { size: 'MT', color: 'Blue', stock: 10, sku: 'SH-OX-BLU-MT' },
          { size: 'LT', color: 'Blue', stock: 10, sku: 'SH-OX-BLU-LT' },
          { size: 'XLT', color: 'Blue', stock: 15, sku: 'SH-OX-BLU-XLT' },
          { size: '2XLT', color: 'Blue', stock: 15, sku: 'SH-OX-BLU-2XLT' },
          { size: '3XLT', color: 'Blue', stock: 15, sku: 'SH-OX-BLU-3XLT' }
        ]
      },
      {
        sub: 'Pants',
        title: 'Chino Slim Trousers',
        desc: 'Stretch cotton-twill chinos in a modern slim fit, engineered with long inseams (34"-36") specifically for heights 6\'0" to 6\'5".',
        price: 2299,
        sale: 1999,
        stock: 35,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078161/1776160930_1162861_q03uav.avif',
        rating: 4.4,
        reviews: 92,
        variants: [
          { size: '30x34', color: 'Khaki', stock: 10, sku: 'PN-CH-KH-3034' },
          { size: '32x34', color: 'Khaki', stock: 15, sku: 'PN-CH-KH-3234' },
          { size: '32x36', color: 'Khaki', stock: 20, sku: 'PN-CH-KH-3236' },
          { size: '34x34', color: 'Khaki', stock: 20, sku: 'PN-CH-KH-3434' },
          { size: '34x36', color: 'Khaki', stock: 15, sku: 'PN-CH-KH-3436' },
          { size: '36x36', color: 'Khaki', stock: 10, sku: 'PN-CH-KH-3636' },
          { size: '38x36', color: 'Khaki', stock: 5, sku: 'PN-CH-KH-3836' }
        ]
      },
      {
        sub: 'Pants',
        title: 'Formal office wear pants',
        desc: 'Formal office wear pants featuring a comfort-stretch waist and a custom 34" or 36" long inseam for taller profiles.',
        price: 3299,
        sale: 1999,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780299542/Limario_Rio_rgiqom.jpg',
        img2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780299541/download_l2tlc4.jpg',
        badge: 'limited-edition',
        rating: 4.6,
        reviews: 110,
        variants: [
          { size: '30x34', color: 'Blue', stock: 10, sku: 'PN-DN-BLU-3034' },
          { size: '32x34', color: 'Blue', stock: 15, sku: 'PN-DN-BLU-3234' },
          { size: '32x36', color: 'Blue', stock: 15, sku: 'PN-DN-BLU-3236' },
          { size: '34x34', color: 'Blue', stock: 15, sku: 'PN-DN-BLU-3434' },
          { size: '34x36', color: 'Blue', stock: 10, sku: 'PN-DN-BLU-3436' },
          { size: '36x36', color: 'Blue', stock: 10, sku: 'PN-DN-BLU-3636' },
          { size: '38x36', color: 'Blue', stock: 5, sku: 'PN-DN-BLU-3836' }
        ]
      },
      {
        sub: 'Jeans',
        title: 'Black Slim Denim',
        desc: 'Clean, versatile black denim engineered for tall builds. Starts at W30 with minimum 34" inseam up to 36" length.',
        price: 2999,
        sale: 0,
        stock: 40,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078227/1776160930_2881167_bf97jq.avif',
        rating: 4.5,
        reviews: 75,
        variants: [
          { size: '30x34', color: 'Black', stock: 10, sku: 'PN-DN-BLK-3034' },
          { size: '32x34', color: 'Black', stock: 15, sku: 'PN-DN-BLK-3234' },
          { size: '32x36', color: 'Black', stock: 15, sku: 'PN-DN-BLK-3236' },
          { size: '34x34', color: 'Black', stock: 20, sku: 'PN-DN-BLK-3434' },
          { size: '34x36', color: 'Black', stock: 15, sku: 'PN-DN-BLK-3436' },
          { size: '36x36', color: 'Black', stock: 10, sku: 'PN-DN-BLK-3636' },
          { size: '38x36', color: 'Black', stock: 5, sku: 'PN-DN-BLK-3836' }
        ]
      },
      {
        sub: 'Streetwear',
        title: 'Urban Utility Cargo Pants',
        desc: 'Multi-pocket heavy duty cotton cargos designed with an active rise and long inseams for 6\'0"-6\'5" tall frames.',
        price: 3499,
        sale: 2799,
        stock: 25,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/bo_20px_solid_rgb:060708/mensvibe/products/1758868613_8376278.avif',
        badge: 'street-drip',
        rating: 4.9,
        reviews: 150,
        variants: [
          { size: '30x34', color: 'Black', stock: 10, sku: 'PN-CRG-BLK-3034' },
          { size: '32x34', color: 'Black', stock: 15, sku: 'PN-CRG-BLK-3234' },
          { size: '32x36', color: 'Black', stock: 10, sku: 'PN-CRG-BLK-3236' },
          { size: '34x34', color: 'Black', stock: 15, sku: 'PN-CRG-BLK-3434' },
          { size: '34x36', color: 'Black', stock: 15, sku: 'PN-CRG-BLK-3436' },
          { size: '36x36', color: 'Black', stock: 10, sku: 'PN-CRG-BLK-3636' },
          { size: '38x36', color: 'Black', stock: 5, sku: 'PN-CRG-BLK-3836' }
        ]
      },
      {
        sub: 'Shirts',
        title: 'Classic Plaid Overshirt',
        desc: 'Classic vintage plaid pattern, soft cotton blend, relaxed oversized style fit tailored with longer arms and body length.',
        price: 2499,
        sale: 1999,
        stock: 20,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781001456/mensvibe/products/1736491521_4981170.avif',
        badge: 'street-drip',
        rating: 4.6,
        reviews: 25,
        variants: [
          { size: 'MT', color: 'Blue Check', stock: 10, sku: 'SH-VPO-BLU-MT' },
          { size: 'LT', color: 'Blue Check', stock: 10, sku: 'SH-VPO-BLU-LT' },
          { size: 'XLT', color: 'Blue Check', stock: 15, sku: 'SH-VPO-BLU-XLT' },
          { size: '2XLT', color: 'Blue Check', stock: 10, sku: 'SH-VPO-BLU-2XLT' },
          { size: '3XLT', color: 'Blue Check', stock: 5, sku: 'SH-VPO-BLU-3XLT' }
        ]
      },
      {
        sub: 'Streetwear',
        title: 'Black indie shirt',
        desc: 'Unique baggy heavy cotton shirt with a street oversized pattern, scaled proportionally for tall frames.',
        price: 1999,
        sale: 1199,
        stock: 105,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074311/1743657072_4845052_poraq8.avif',
        img2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074311/1743657072_7439712_tk4euo.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074310/1743657072_9580718_vojgz5.avif'],
        badge: 'limited-edition',
        rating: 4.8,
        reviews: 40,
        variants: [
          { size: 'MT', color: 'Neon Black', stock: 5, sku: 'VT-NST-MT' },
          { size: 'LT', color: 'Neon Black', stock: 5, sku: 'VT-NST-LT' },
          { size: 'XLT', color: 'Neon Black', stock: 8, sku: 'VT-NST-XLT' },
          { size: '2XLT', color: 'Neon Black', stock: 10, sku: 'VT-NST-2XLT' },
          { size: '3XLT', color: 'Neon Black', stock: 10, sku: 'VT-NST-3XLT' }
        ]
      },
      {
        sub: 'Linen',
        title: 'Premium Pink Linen Shirt',
        desc: 'Relaxed fit, pure organic linen shirt. Light, breathable, and styled with tall specifications (longer sleeves and torso).',
        price: 2999,
        sale: 1999,
        stock: 30,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074252/lightpink_e3zhzx.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074253/1779703404_2796734_h243zv.avif'],
        badge: 'new-arrival',
        variants: [
          { size: 'MT', color: 'Pink', stock: 10, sku: 'LN-PNK-MT' },
          { size: 'LT', color: 'Pink', stock: 10, sku: 'LN-PNK-LT' },
          { size: 'XLT', color: 'Pink', stock: 15, sku: 'LN-PNK-XLT' },
          { size: '2XLT', color: 'Pink', stock: 15, sku: 'LN-PNK-2XLT' },
          { size: '3XLT', color: 'Pink', stock: 15, sku: 'LN-PNK-3XLT' }
        ]
      },
      {
        sub: 'Streetwear',
        title: 'Oversized Acid Wash Tee',
        desc: 'Vintage acid wash heavy cotton tee with drop shoulders and custom long body length for 6\'0"-6\'5" guys.',
        price: 1999,
        sale: 1499,
        stock: 45,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074257/ac_t3islz.avif',
        extraImgs: [
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074255/acidgreen_axuirf.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/i_v9qslc.avif',
          'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/acid_ixbr2q.avif'
        ],
        badge: 'street-drip',
        rating: 4.7,
        reviews: 58,
        variants: [
          { size: 'MT', color: 'Grey', stock: 10, sku: 'SW-AW-GRY-MT' },
          { size: 'LT', color: 'Grey', stock: 10, sku: 'SW-AW-GRY-LT' },
          { size: 'XLT', color: 'Grey', stock: 15, sku: 'SW-AW-GRY-XLT' },
          { size: '2XLT', color: 'Grey', stock: 15, sku: 'SW-AW-GRY-2XLT' },
          { size: '3XLT', color: 'Grey', stock: 15, sku: 'SW-AW-GRY-3XLT' }
        ]
      },
      {
        sub: 'Streetwear',
        title: 'Oversize T-Shirt-Red Samurai',
        desc: 'Red Samurai graphic print, heavy knit oversized streetwear tee tailored with added height clearance.',
        price: 999,
        sale: 499,
        stock: 12,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078662/1772696574_8564664_zzldxf.avif',
        img2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078679/1772279583_4098767_hezzsd.avif',
        img3: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078664/1772279583_3693413_i9ome5.avif',
        img4: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781078662/1772696574_8564664_zzldxf.avif',
        badge: 'street-drip',
        rating: 4.9,
        reviews: 24,
        variants: [
          { size: 'MT', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB-MT' },
          { size: 'LT', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB-LT' },
          { size: 'XLT', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB-XLT' },
          { size: '2XLT', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB-2XLT' },
          { size: '3XLT', color: 'Neon Black', stock: 5, sku: 'SW-TJ-NB-3XLT' }
        ]
      },
      {
        sub: 'Linen',
        title: 'Classic White Linen Shirt',
        desc: 'Tailored from premium breathable linen, regular fit with classic collar and customized long torso.',
        price: 2799,
        sale: 1899,
        stock: 25,
        img: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984919/mensvibe/products/1739601040_8064076.avif',
        extraImgs: ['https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984921/mensvibe/products/1739601040_1918057.avif'],
        badge: 'limited-edition',
        variants: [
          { size: 'MT', color: 'White', stock: 10, sku: 'LN-WHT-MT' },
          { size: 'LT', color: 'White', stock: 10, sku: 'LN-WHT-LT' },
          { size: 'XLT', color: 'White', stock: 15, sku: 'LN-WHT-XLT' },
          { size: '2XLT', color: 'White', stock: 10, sku: 'LN-WHT-2XLT' },
          { size: '3XLT', color: 'White', stock: 15, sku: 'LN-WHT-3XLT' }
        ]
      },
      {
        _id: '6a27ed6aad7d78cd89ec2266',
        sub: 'Shirts',
        title: 'Vintage Plaid Overshirt',
        desc: 'Classic vintage plaid pattern, soft cotton blend, oversized fit cut for tall frames.',
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
        variants: [
          { size: 'MT', color: 'Blue Check', stock: 5, sku: 'SH-VPO-MT' },
          { size: 'LT', color: 'Blue Check', stock: 5, sku: 'SH-VPO-LT' },
          { size: 'XLT', color: 'Blue Check', stock: 8, sku: 'SH-VPO-XLT' },
          { size: '2XLT', color: 'Blue Check', stock: 10, sku: 'SH-VPO-2XLT' },
          { size: '3XLT', color: 'Blue Check', stock: 10, sku: 'SH-VPO-3XLT' }
        ]
      },
      {
        _id: '6a27ebfaad7d78cd89ec2128',
        sub: 'T-Shirts',
        title: 'superman vintage black T-shirt',
        desc: 'Gen-Z graphic tee, vintage distressed wash, styled with extra length.',
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
        variants: [
          { size: 'MT', color: 'Black', stock: 5, sku: 'TS-SUP-MT' },
          { size: 'LT', color: 'Black', stock: 5, sku: 'TS-SUP-LT' },
          { size: 'XLT', color: 'Black', stock: 8, sku: 'TS-SUP-XLT' },
          { size: '2XLT', color: 'Black', stock: 10, sku: 'TS-SUP-2XLT' },
          { size: '3XLT', color: 'Black', stock: 10, sku: 'TS-SUP-3XLT' }
        ]
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
          { size: '30x34', color: 'Grey', stock: 10, sku: 'PN-CRG-GRY-3034' },
          { size: '32x34', color: 'Grey', stock: 15, sku: 'PN-CRG-GRY-3234' },
          { size: '32x36', color: 'Grey', stock: 15, sku: 'PN-CRG-GRY-3236' },
          { size: '34x34', color: 'Grey', stock: 20, sku: 'PN-CRG-GRY-3434' },
          { size: '34x36', color: 'Grey', stock: 15, sku: 'PN-CRG-GRY-3436' },
          { size: '36x36', color: 'Grey', stock: 10, sku: 'PN-CRG-GRY-3636' },
          { size: '38x36', color: 'Grey', stock: 5, sku: 'PN-CRG-GRY-3836' }
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
        desc: 'Genuine leather upper with a classic silhouette. Available in hard-to-find sizes UK 10.5 to 14 with a comfortable, wide toe-box.',
        price: 5499,
        sale: 4499,
        stock: 15,
        img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=2000&auto=format&fit=crop',
        variants: [
          { size: 'UK 10.5', color: 'White', stock: 5, sku: 'SK-WHT-105' },
          { size: 'UK 11', color: 'White', stock: 5, sku: 'SK-WHT-11' },
          { size: 'UK 12', color: 'White', stock: 5, sku: 'SK-WHT-12' },
          { size: 'UK 13', color: 'White', stock: 5, sku: 'SK-WHT-13' },
          { size: 'UK 14', color: 'White', stock: 5, sku: 'SK-WHT-14' }
        ]
      },
      {
        sub: 'Boots',
        title: 'Classic Chelsea Leather Boots',
        desc: 'Handcrafted premium leather Chelsea boots with elastic side panels, custom-engineered support, and extended sizes UK 10.5 to 14.',
        price: 6999,
        sale: 5999,
        stock: 20,
        img: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800',
        variants: [
          { size: 'UK 10.5', color: 'Brown', stock: 5, sku: 'BT-CHL-BRN-105' },
          { size: 'UK 11', color: 'Brown', stock: 10, sku: 'BT-CHL-BRN-11' },
          { size: 'UK 12', color: 'Brown', stock: 10, sku: 'BT-CHL-BRN-12' },
          { size: 'UK 13', color: 'Brown', stock: 5, sku: 'BT-CHL-BRN-13' },
          { size: 'UK 14', color: 'Brown', stock: 5, sku: 'BT-CHL-BRN-14' }
        ]
      },
      {
        sub: 'Sports',
        title: 'Lightweight Running Shoes',
        desc: 'Breathable mesh upper with cushioned sole for track and road running. Wide-toe box support for large sizes UK 10.5 to 14.',
        price: 3999,
        sale: 2999,
        stock: 30,
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
        variants: [
          { size: 'UK 10.5', color: 'Red', stock: 5, sku: 'SH-RUN-RED-105' },
          { size: 'UK 11', color: 'Red', stock: 10, sku: 'SH-RUN-RED-11' },
          { size: 'UK 12', color: 'Red', stock: 10, sku: 'SH-RUN-RED-12' },
          { size: 'UK 13', color: 'Red', stock: 5, sku: 'SH-RUN-RED-13' },
          { size: 'UK 14', color: 'Red', stock: 5, sku: 'SH-RUN-RED-14' }
        ]
      }
    ]
  }
];

const couponsData = [
  { code: 'MENSVIBE10', discountType: 'percentage', discountValue: 10, minCartAmount: 499, usageLimit: null, perUserLimit: null, isActive: true },
  { code: 'FESTIVE500', discountType: 'flat', discountValue: 500, minCartAmount: 2499, usageLimit: 100, perUserLimit: 1, isActive: true },
  { code: 'WELCOME50', discountType: 'flat', discountValue: 50, minCartAmount: 0, usageLimit: null, perUserLimit: 1, isActive: true, newUsersOnly: true }
];

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * CSV IMPORT LOGIC (Consolidated from csvImport.controller)
 */
const importFromCSV = async (csvPath, adminUser) => {
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    console.error('CSV Parse Errors:', parsed.errors);
    return;
  }

  const rows = parsed.data;
  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];
  const catCache = new Map();
  const subCache = new Map();

  console.log(`Processing ${rows.length} rows from CSV...`);

  for (const [index, row] of rows.entries()) {
    try {
      const {
        title, description, price, discountedPrice, category, subcategory,
        stock, badge, variant_color, variant_size, variant_stock, variant_price, image
      } = row;

      if (!title || !price || !category || !subcategory) {
        errors.push(`Row ${index + 2}: Missing required fields`);
        continue;
      }

      // Resolve Category
      let catId = catCache.get(category.trim().toLowerCase());
      if (!catId) {
        let catDoc = await Category.findOne({ name: new RegExp(`^${escapeRegex(category.trim())}$`, 'i') });
        if (!catDoc) {
          catDoc = await Category.create({ name: category.trim() });
        }
        catId = catDoc._id;
        catCache.set(category.trim().toLowerCase(), catId);
      }

      // Resolve Subcategory
      let subId = subCache.get(`${catId}_${subcategory.trim().toLowerCase()}`);
      if (!subId) {
        let subDoc = await Subcategory.findOne({
          name: new RegExp(`^${escapeRegex(subcategory.trim())}$`, 'i'),
          category: catId
        });
        if (!subDoc) {
          subDoc = await Subcategory.create({ name: subcategory.trim(), category: catId });
        }
        subId = subDoc._id;
        subCache.set(`${catId}_${subcategory.trim().toLowerCase()}`, subId);
      }

      let product = await Product.findOne({ title: title.trim(), seller: adminUser._id });

      const variant = (variant_color || variant_size) ? {
        color: variant_color ? variant_color.trim() : '',
        size: variant_size ? variant_size.trim() : '',
        stock: variant_stock ? Number(variant_stock) : 0,
        price: variant_price ? Number(variant_price) : null,
      } : null;

      if (product) {
        product.price = Number(price);
        if (variant) {
          const existingVarIndex = product.variants.findIndex(v => v.color === variant.color && v.size === variant.size);
          if (existingVarIndex >= 0) {
            product.variants[existingVarIndex].stock = variant.stock;
          } else {
            product.variants.push(variant);
          }
        }
        await product.save();
        updatedCount++;
      } else {
        await Product.create({
          title: title.trim(),
          description: description || 'Imported from CSV',
          price: Number(price),
          discountedPrice: discountedPrice ? Number(discountedPrice) : null,
          category: catId,
          subcategory: subId,
          stock: stock ? Number(stock) : 10,
          badge: badge || '',
          seller: adminUser._id,
          gender: 'men',
          image: image || '',
          variants: variant ? [variant] : []
        });
        createdCount++;
      }
    } catch (err) {
      errors.push(`Row ${index + 2}: ${err.message}`);
    }
  }
  console.log(`CSV Import Result: ${createdCount} created, ${updatedCount} updated. Errors: ${errors.length}`);
  if (errors.length) console.log('Sample errors:', errors.slice(0, 5));
};

/**
 * THE MAIN SEED FUNCTION
 */
const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    const isProduction = mongoUri.includes('mongodb+srv') || mongoUri.includes('cluster') || mongoUri.includes('mongodb.net');

    if (isProduction && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      console.error('⚠️ CRITICAL: PRODUCTION DATABASE DETECTED. Aborting.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to DB: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

    const args = process.argv.slice(2);
    const csvIndex = args.indexOf('--csv');

    if (csvIndex !== -1 && args[csvIndex + 1]) {
      const csvPath = args[csvIndex + 1];
      console.log(`Starting CSV import from ${csvPath}...`);

      let admin = await User.findOne({ role: 'admin' });
      if (!admin) {
        console.log('No admin found. Creating a temporary one for import...');
        admin = await User.create({
          name: 'Import Admin',
          email: 'import-admin@mensvibe.in',
          password: 'StrongP@ss123!',
          role: 'admin'
        });
      }

      await importFromCSV(csvPath, admin);
      console.log('CSV Import done.');
      process.exit(0);
    }

    // DEFAULT SEED (WIPE & REFILL)
    console.log('Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Subcategory.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({})
    ]);

    console.log('Creating demo users...');
    await User.create({
      name: 'Vibe Admin',
      email: 'admin@mensvibe.in',
      password: 'StrongP@ss123!',
      role: 'admin',
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
      brandName: 'MensVibe',
      email: 'seller@mensvibe.in',
      password: 'StrongP@ss123!',
      role: 'seller',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
    });

    const nikeSeller = await User.create({
      name: 'Nike India',
      brandName: 'Nike Authorized',
      email: 'nike@mensvibe.in',
      password: 'StrongP@ss123!',
      role: 'seller'
    });

    await User.create({
      name: 'Regular Customer',
      email: 'demo@mensvibe.in',
      password: 'StrongP@ss123!',
      role: 'user'
    });

    const subIds = {};
    console.log('Seeding catalog...');

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
          images: p.extraImgs || [p.img2, p.img3, p.img4].filter(Boolean),
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

    for (const c of couponsData) await Coupon.create(c);

    console.log('--- MensVibe seed complete ---')
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
