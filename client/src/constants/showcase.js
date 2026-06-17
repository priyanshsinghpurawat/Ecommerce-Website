/** Hero carousel slides (Powerlook-style full-width banners) */
export const HERO_SLIDES = [
  {
    id: 'casual',
    eyebrow: 'New season',
    title: 'Casual Flex',
    subtitle: 'COLLECTION',
    description: 'Shirts & tees built for school-to-street — breathable fits, bold colours.',
    image: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781001456/mensvibe/products/1764660274_2193914.avif',
    image2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781001455/mensvibe/products/1736491521_4978820.avif',
    image3: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781001457/mensvibe/products/1764057049_4505939.avif',
    cta: 'Shop shirts',
    link: '/shop?subcategory=Shirts',
    link1: '/shop?subcategory=Shirts',
    link2: '/shop?subcategory=T-Shirts',
    link3: '/shop?subcategory=Shirts',
  },
  {
    id: 'sport',
    eyebrow: 'Performance drop',
    title: 'Sportswear',
    subtitle: 'EDIT',
    description: 'Training tees, track pants & sports shoes — move light, look sharp.',
    image: '/assets/hero_sport.png',
    cta: 'Shop sportswear',
    link: '/shop?subcategory=Sportswear',
    gradient: 'from-zinc-950/90 via-zinc-900/45 to-transparent'
  },
  {
    id: 'street',
    eyebrow: 'Trending now',
    title: 'Street Kicks',
    subtitle: 'FOOTWEAR',
    description: 'Sneakers & runners — cushion, grip, and everyday drip.',
    image: '/assets/hero_street.png',
    cta: 'Shop footwear',
    link: '/shop?category=Footwear',
    gradient: 'from-slate-950/90 via-slate-900/45 to-transparent'
  },
  {
    id: 'street-drip',
    eyebrow: 'Urban essentials',
    title: 'Street Drip',
    subtitle: 'INTERACTIVE LOOKBOOK',
    description: 'Tap on interactive hotspots to shop complete utility fits, oversized layers, and custom cargos.',
    image: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/brown_tvlluh.avif',
    cta: 'Explore Lookbook',
    link: '/street-drip',
    gradient: 'from-zinc-950/90 via-zinc-900/45 to-transparent'
  },
  {
    id: 'accessories',
    eyebrow: 'Finish the look',
    title: 'Linen & Formals',
    subtitle: 'PREMIUM STYLE',
    description: 'Breathable linen shirts, premium structured trousers, and timeless formal wear for the modern man.',
    image: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984919/mensvibe/products/1739601040_8064076.avif',
    image2: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781077001/1739774935_1647535_jmoydf.avif',
    image3: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1780984921/mensvibe/products/1739601040_1918057.avif',
    cta: 'Explore linen',
    link: '/shop?subcategory=Linen',
    link1: '/shop?subcategory=Shirts',
    link2: '/shop?subcategory=Pants',
    link3: '/shop?subcategory=Shirts',
    gradient: 'from-stone-950/90 via-stone-900/40 to-transparent'
  }
];

export const CATEGORY_BANNERS = {
  Clothing: {
    image: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781074254/br_mr3443.avif',
    tagline: 'Tees · Pants · Linen'
  },
  Footwear: {
    image: 'https://res.cloudinary.com/decppyzuk/image/upload/q_auto/f_auto/v1781202046/copy_of_scuderia-ferrari-rs-x-mid-motorsport-sneakers_1.avif',
    tagline: 'Sneakers · Sports · Slides'
  }
};

/** Subcategory names highlighted in nav & home chips */
export const FEATURED_SUBCATEGORY_NAMES = [
  'T-Shirts',
  'Shirts',
  'Linen',
  'Streetwear',
  'Pants',
  'Jeans',
  'Sportswear',
  'Track Pants',
  'Sneakers',
  'Sports Shoes'
];
