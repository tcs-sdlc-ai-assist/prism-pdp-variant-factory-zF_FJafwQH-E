export const STORAGE_KEYS = {
  CATALOG_KEY: 'prism_catalog',
  COHORT_SET_KEY: 'prism_cohort_sets',
  VARIANTS_KEY: 'prism_variants',
  MANIFESTS_KEY: 'prism_manifests',
  CART_KEY: 'prism_cart',
};

export const BRAND_COLORS = {
  primary: '#0046BE',
  accent: '#FFF200',
  neutral: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
};

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const MAX_VARIANTS = 10;

export const DEFAULT_BATCH_SIZE = 25;

export const TAILORING_DIMENSIONS = [
  'price',
  'promotion',
  'badge',
  'media',
  'description',
  'title',
  'rating',
  'fulfillment',
  'warranty',
  'accessories',
];

export const COHORT_OPTIONS = [
  { value: 'new_visitor', label: 'New Visitor' },
  { value: 'returning_customer', label: 'Returning Customer' },
  { value: 'loyalty_member', label: 'Loyalty Member' },
  { value: 'high_value', label: 'High Value Customer' },
  { value: 'bargain_seeker', label: 'Bargain Seeker' },
  { value: 'tech_enthusiast', label: 'Tech Enthusiast' },
  { value: 'business_buyer', label: 'Business Buyer' },
  { value: 'student', label: 'Student' },
];

export const BEHAVIORAL_OVERLAY_OPTIONS = [
  { value: 'browse_history', label: 'Browse History' },
  { value: 'cart_abandonment', label: 'Cart Abandonment' },
  { value: 'purchase_frequency', label: 'Purchase Frequency' },
  { value: 'category_affinity', label: 'Category Affinity' },
  { value: 'price_sensitivity', label: 'Price Sensitivity' },
  { value: 'brand_loyalty', label: 'Brand Loyalty' },
  { value: 'session_depth', label: 'Session Depth' },
  { value: 'device_type', label: 'Device Type' },
];

export const ROUTE_PATHS = {
  HOME: '/',
  CATALOG: '/catalog',
  CATALOG_DETAIL: '/catalog/:productId',
  VARIANTS: '/variants',
  VARIANT_EDITOR: '/variants/:variantId',
  VARIANT_CREATE: '/variants/create',
  COHORTS: '/cohorts',
  COHORT_DETAIL: '/cohorts/:cohortId',
  MANIFESTS: '/manifests',
  MANIFEST_DETAIL: '/manifests/:manifestId',
  PREVIEW: '/preview',
  SETTINGS: '/settings',
};