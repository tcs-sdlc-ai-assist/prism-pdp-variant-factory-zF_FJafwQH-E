/**
 * Seeded mock catalog data for the Prism PDP Variant Factory.
 * Contains 6 SKU objects with realistic Best Buy-style product data.
 *
 * @module mockCatalog
 */

/**
 * @typedef {Object} CatalogItem
 * @property {string} id - Unique product identifier
 * @property {string} sku - Stock keeping unit
 * @property {string} title - Product title
 * @property {string} description - Product description
 * @property {number} price - Regular price in USD
 * @property {number} memberPrice - Loyalty member price in USD
 * @property {number} rating - Average customer rating (0-5)
 * @property {number} reviewCount - Number of customer reviews
 * @property {string} category - Product category
 * @property {string} imageUrl - Primary product image URL (placeholder)
 * @property {string[]} media - Array of media placeholder URLs
 * @property {string[]} features - Key product features
 * @property {Object} specs - Product specifications
 * @property {string} brand - Product brand name
 * @property {string} fulfillment - Fulfillment method
 * @property {string} warranty - Warranty information
 * @property {string} badge - Promotional badge text
 */

/** @type {CatalogItem[]} */
const mockCatalog = [
  {
    id: 'prod-tv-001',
    sku: 'SKU-6548320',
    title: 'Samsung 65" Class QN90C Neo QLED 4K Smart TV (2024)',
    description:
      'Experience stunning picture quality with Quantum Matrix Technology and Neural Quantum Processor 4K. Dolby Atmos and Object Tracking Sound deliver immersive audio. Anti-Reflection technology ensures a clear picture in any lighting.',
    price: 1599.99,
    memberPrice: 1499.99,
    rating: 4.7,
    reviewCount: 2843,
    category: 'TVs & Home Theater',
    imageUrl: 'https://placehold.co/600x400/0046BE/FFF200?text=Samsung+65+QLED',
    media: [
      'https://placehold.co/600x400/0046BE/FFF200?text=Samsung+65+QLED+Front',
      'https://placehold.co/600x400/0046BE/FFF200?text=Samsung+65+QLED+Side',
      'https://placehold.co/600x400/0046BE/FFF200?text=Samsung+65+QLED+Back',
      'https://placehold.co/600x400/0046BE/FFF200?text=Samsung+65+QLED+Remote',
    ],
    features: [
      'Neo QLED 4K with Quantum Matrix Technology',
      'Neural Quantum Processor 4K',
      'Dolby Atmos & Object Tracking Sound+',
      'Anti-Reflection coating',
      'Samsung Gaming Hub built-in',
      'SmartThings integration',
    ],
    specs: {
      screenSize: '65"',
      resolution: '3840 x 2160 (4K UHD)',
      displayType: 'Neo QLED',
      refreshRate: '120Hz',
      hdr: 'Quantum HDR 32X',
      smartPlatform: 'Tizen',
      ports: '4 HDMI, 2 USB',
      weight: '53.6 lbs',
    },
    brand: 'Samsung',
    fulfillment: 'Free shipping. Arrives in 3-5 business days.',
    warranty: '1-year manufacturer warranty included',
    badge: 'Best Seller',
  },
  {
    id: 'prod-laptop-002',
    sku: 'SKU-6571042',
    title: 'Apple MacBook Pro 14" — M3 Pro Chip, 18GB RAM, 512GB SSD (2024)',
    description:
      'The MacBook Pro 14" with M3 Pro chip delivers exceptional performance for demanding workflows. Featuring a stunning Liquid Retina XDR display, up to 17 hours of battery life, and a pro-level camera and audio system.',
    price: 1999.99,
    memberPrice: 1949.99,
    rating: 4.8,
    reviewCount: 5127,
    category: 'Computers & Tablets',
    imageUrl: 'https://placehold.co/600x400/333333/FFFFFF?text=MacBook+Pro+14',
    media: [
      'https://placehold.co/600x400/333333/FFFFFF?text=MacBook+Pro+14+Open',
      'https://placehold.co/600x400/333333/FFFFFF?text=MacBook+Pro+14+Closed',
      'https://placehold.co/600x400/333333/FFFFFF?text=MacBook+Pro+14+Side',
      'https://placehold.co/600x400/333333/FFFFFF?text=MacBook+Pro+14+Keyboard',
    ],
    features: [
      'Apple M3 Pro chip with 11-core CPU and 14-core GPU',
      '18GB unified memory',
      '512GB SSD storage',
      'Liquid Retina XDR display with ProMotion',
      'Up to 17 hours of battery life',
      'Three Thunderbolt 4 ports, HDMI, SDXC, MagSafe 3',
    ],
    specs: {
      processor: 'Apple M3 Pro',
      memory: '18GB Unified',
      storage: '512GB SSD',
      display: '14.2" Liquid Retina XDR',
      resolution: '3024 x 1964',
      battery: 'Up to 17 hours',
      weight: '3.5 lbs',
      os: 'macOS Sonoma',
    },
    brand: 'Apple',
    fulfillment: 'Free next-day delivery. Pick up today at select stores.',
    warranty: '1-year Apple limited warranty',
    badge: 'Top Rated',
  },
  {
    id: 'prod-headphones-003',
    sku: 'SKU-6505727',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Over-Ear Headphones',
    description:
      'Industry-leading noise cancellation with Auto NC Optimizer. Crystal-clear hands-free calling with 4 beamforming microphones. Up to 30 hours of battery life with quick charging. Multipoint connection for seamless device switching.',
    price: 349.99,
    memberPrice: 329.99,
    rating: 4.6,
    reviewCount: 8914,
    category: 'Headphones',
    imageUrl: 'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sony+WH-1000XM5',
    media: [
      'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sony+XM5+Front',
      'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sony+XM5+Side',
      'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sony+XM5+Folded',
      'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sony+XM5+Case',
    ],
    features: [
      'Industry-leading noise cancellation with 8 microphones',
      'Auto NC Optimizer adapts to environment',
      '30-hour battery life',
      'Quick charge: 3 min for 3 hours playback',
      'Multipoint connection (2 devices)',
      'Speak-to-Chat auto-pause',
    ],
    specs: {
      driver: '30mm',
      frequencyResponse: '4Hz - 40,000Hz',
      bluetooth: '5.2',
      codec: 'LDAC, AAC, SBC',
      noiseCancellation: 'Adaptive ANC',
      batteryLife: '30 hours (ANC on)',
      weight: '8.8 oz',
      foldable: 'Yes',
    },
    brand: 'Sony',
    fulfillment: 'Free shipping. Same-day delivery available.',
    warranty: '1-year manufacturer warranty',
    badge: 'Price Drop',
  },
  {
    id: 'prod-speaker-004',
    sku: 'SKU-6487278',
    title: 'Amazon Echo Studio — High-Fidelity Smart Speaker with Alexa',
    description:
      'Immersive, room-filling sound with 5 speakers and Dolby Atmos support. Alexa voice control for music, smart home, and more. Spatial audio processing adapts to your room acoustics automatically.',
    price: 199.99,
    memberPrice: 179.99,
    rating: 4.4,
    reviewCount: 3672,
    category: 'Smart Home',
    imageUrl: 'https://placehold.co/600x400/232f3e/ff9900?text=Echo+Studio',
    media: [
      'https://placehold.co/600x400/232f3e/ff9900?text=Echo+Studio+Front',
      'https://placehold.co/600x400/232f3e/ff9900?text=Echo+Studio+Top',
      'https://placehold.co/600x400/232f3e/ff9900?text=Echo+Studio+Back',
    ],
    features: [
      '5 internal speakers with 330W peak power',
      'Dolby Atmos and Sony 360 Reality Audio',
      'Automatic room adaptation technology',
      'Built-in Zigbee and Matter smart home hub',
      'Alexa voice assistant',
      'Multi-room music with other Echo devices',
    ],
    specs: {
      speakers: '5 (1 woofer, 3 midrange, 1 tweeter)',
      audio: 'Dolby Atmos, Sony 360 Reality Audio',
      connectivity: 'Wi-Fi 6, Bluetooth 5.0, Zigbee, Matter',
      dimensions: '8.1" x 6.9" x 6.9"',
      weight: '7.7 lbs',
      powerSource: 'AC adapter',
      color: 'Charcoal',
    },
    brand: 'Amazon',
    fulfillment: 'Free shipping. Arrives in 2-3 business days.',
    warranty: '1-year limited warranty',
    badge: 'Great Value',
  },
  {
    id: 'prod-tablet-005',
    sku: 'SKU-6534512',
    title: 'Apple iPad Air 11" (M2) — 128GB, Wi-Fi, Space Gray (2024)',
    description:
      'The new iPad Air features the powerful M2 chip, a stunning 11-inch Liquid Retina display, and support for Apple Pencil Pro. Perfect for creative work, productivity, and entertainment on the go.',
    price: 599.99,
    memberPrice: 574.99,
    rating: 4.7,
    reviewCount: 1956,
    category: 'Computers & Tablets',
    imageUrl: 'https://placehold.co/600x400/8e8e93/FFFFFF?text=iPad+Air+11',
    media: [
      'https://placehold.co/600x400/8e8e93/FFFFFF?text=iPad+Air+Front',
      'https://placehold.co/600x400/8e8e93/FFFFFF?text=iPad+Air+Back',
      'https://placehold.co/600x400/8e8e93/FFFFFF?text=iPad+Air+Pencil',
      'https://placehold.co/600x400/8e8e93/FFFFFF?text=iPad+Air+Keyboard',
    ],
    features: [
      'Apple M2 chip with 8-core CPU and 10-core GPU',
      '11-inch Liquid Retina display with P3 wide color',
      'Apple Pencil Pro and Magic Keyboard support',
      '12MP wide camera and 12MP front camera with Center Stage',
      'Wi-Fi 6E connectivity',
      'All-day battery life up to 10 hours',
    ],
    specs: {
      processor: 'Apple M2',
      storage: '128GB',
      display: '11" Liquid Retina',
      resolution: '2360 x 1640',
      camera: '12MP Wide, 12MP Front',
      battery: 'Up to 10 hours',
      weight: '1.02 lbs',
      os: 'iPadOS 17',
    },
    brand: 'Apple',
    fulfillment: 'Free shipping. Pick up in 1 hour at your local store.',
    warranty: '1-year Apple limited warranty',
    badge: 'New Release',
  },
  {
    id: 'prod-console-006',
    sku: 'SKU-6563925',
    title: 'Sony PlayStation 5 Slim Console — 1TB Digital Edition',
    description:
      'Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with haptic feedback and adaptive triggers, and stunning visuals with ray tracing. The slim design takes up less space while delivering next-gen gaming.',
    price: 449.99,
    memberPrice: 439.99,
    rating: 4.8,
    reviewCount: 12483,
    category: 'Video Games',
    imageUrl: 'https://placehold.co/600x400/00439c/FFFFFF?text=PS5+Slim',
    media: [
      'https://placehold.co/600x400/00439c/FFFFFF?text=PS5+Slim+Front',
      'https://placehold.co/600x400/00439c/FFFFFF?text=PS5+Slim+Side',
      'https://placehold.co/600x400/00439c/FFFFFF?text=PS5+Slim+Controller',
      'https://placehold.co/600x400/00439c/FFFFFF?text=PS5+Slim+Box',
    ],
    features: [
      'Custom AMD Zen 2 CPU and RDNA 2 GPU',
      '1TB ultra-high-speed SSD',
      'Ray tracing and 4K gaming up to 120fps',
      'DualSense wireless controller with haptic feedback',
      'Tempest 3D AudioTech',
      'Backward compatible with PS4 games',
    ],
    specs: {
      cpu: 'AMD Zen 2, 8-core 3.5GHz',
      gpu: 'AMD RDNA 2, 10.28 TFLOPS',
      storage: '1TB SSD',
      resolution: 'Up to 4K at 120fps',
      audio: 'Tempest 3D AudioTech',
      connectivity: 'Wi-Fi 6, Bluetooth 5.1, USB-C',
      dimensions: '14.2" x 3.6" x 8.5"',
      weight: '6.3 lbs',
    },
    brand: 'Sony',
    fulfillment: 'Free shipping. Limited availability — order now.',
    warranty: '1-year manufacturer warranty',
    badge: 'Member Deal',
  },
];

export default mockCatalog;