/**
 * Default cohort and behavioral overlay definitions for the Prism PDP Variant Factory.
 * Contains 10 pre-configured cohort × behavior targets with labels, cohort types,
 * behavioral overlays, base SKUs, and tailoring emphasis settings.
 *
 * @module defaultCohorts
 */

/**
 * @typedef {Object} TailoringEmphasis
 * @property {number} weight - Emphasis weight (0-100)
 * @property {string} strategy - Tailoring strategy description
 */

/**
 * @typedef {Object} CohortTarget
 * @property {string} cohortId - Unique cohort target identifier
 * @property {string} label - Human-readable label for the cohort target
 * @property {string} cohortType - The type/segment of the cohort
 * @property {string} behavioralOverlay - Behavioral overlay applied to this target
 * @property {string} baseSku - The base SKU from the mock catalog this target applies to
 * @property {number} priority - Priority ranking (1 = highest)
 * @property {Object.<string, TailoringEmphasis>} tailoringEmphasis - Per-dimension tailoring emphasis
 */

/**
 * @typedef {Object} DefaultCohortSet
 * @property {string} id - Unique cohort set identifier
 * @property {string} name - Human-readable name for the cohort set
 * @property {string} description - Description of the cohort set
 * @property {CohortTarget[]} cohorts - Array of cohort targets
 * @property {string} createdAt - ISO 8601 creation timestamp
 * @property {string} updatedAt - ISO 8601 last-updated timestamp
 */

/** @type {DefaultCohortSet} */
const defaultCohorts = {
  id: 'cohort-set-default-001',
  name: 'Default PDP Variant Cohort Set',
  description:
    'Pre-configured set of 10 cohort × behavioral overlay targets for PDP variant generation demos.',
  cohorts: [
    {
      cohortId: 'cohort-target-001',
      label: 'Budget-Conscious Browse-Heavy Shopper',
      cohortType: 'budget-conscious',
      behavioralOverlay: 'browse-heavy',
      baseSku: 'SKU-6548320',
      priority: 1,
      behavioralOverlays: ['browse_history', 'price_sensitivity'],
      tailoringEmphasis: {
        price: { weight: 90, strategy: 'Highlight savings, show member price prominently' },
        promotion: { weight: 85, strategy: 'Surface active promotions and bundle deals' },
        badge: { weight: 60, strategy: 'Show price-drop and clearance badges' },
        fulfillment: { weight: 40, strategy: 'Emphasize free shipping threshold' },
      },
    },
    {
      cohortId: 'cohort-target-002',
      label: 'Tech Enthusiast Comparison Shopper',
      cohortType: 'tech-enthusiast',
      behavioralOverlay: 'comparison-shopper',
      baseSku: 'SKU-6571042',
      priority: 2,
      behavioralOverlays: ['category_affinity', 'session_depth'],
      tailoringEmphasis: {
        description: { weight: 95, strategy: 'Expand technical specifications and benchmarks' },
        media: { weight: 80, strategy: 'Show detailed product shots and teardown views' },
        rating: { weight: 70, strategy: 'Highlight expert reviews and detailed ratings breakdown' },
        accessories: { weight: 65, strategy: 'Recommend compatible peripherals and upgrades' },
      },
    },
    {
      cohortId: 'cohort-target-003',
      label: 'First-Time Buyer Deal Seeker',
      cohortType: 'first-time-buyer',
      behavioralOverlay: 'deal-seeker',
      baseSku: 'SKU-6505727',
      priority: 3,
      behavioralOverlays: ['price_sensitivity', 'browse_history'],
      tailoringEmphasis: {
        price: { weight: 85, strategy: 'Show introductory offers and first-purchase discounts' },
        promotion: { weight: 90, strategy: 'Feature welcome deals and starter bundles' },
        warranty: { weight: 75, strategy: 'Highlight protection plans for peace of mind' },
        description: { weight: 50, strategy: 'Simplify description for new buyers' },
      },
    },
    {
      cohortId: 'cohort-target-004',
      label: 'Loyalty Member Cart Abandoner',
      cohortType: 'loyalty-member',
      behavioralOverlay: 'cart-abandoner',
      baseSku: 'SKU-6548320',
      priority: 4,
      behavioralOverlays: ['cart_abandonment', 'brand_loyalty'],
      tailoringEmphasis: {
        price: { weight: 80, strategy: 'Show exclusive member pricing and points earning' },
        badge: { weight: 85, strategy: 'Display member-exclusive and limited-time badges' },
        fulfillment: { weight: 90, strategy: 'Emphasize fast free shipping for members' },
        promotion: { weight: 70, strategy: 'Show cart recovery incentives' },
      },
    },
    {
      cohortId: 'cohort-target-005',
      label: 'Gift Shopper Seasonal Browser',
      cohortType: 'gift-shopper',
      behavioralOverlay: 'seasonal-browser',
      baseSku: 'SKU-6487278',
      priority: 5,
      behavioralOverlays: ['browse_history', 'purchase_frequency'],
      tailoringEmphasis: {
        badge: { weight: 90, strategy: 'Show gift-ready and top-gift badges' },
        fulfillment: { weight: 95, strategy: 'Highlight gift wrapping and delivery by date' },
        price: { weight: 60, strategy: 'Show gift price ranges and bundle savings' },
        accessories: { weight: 75, strategy: 'Suggest complementary gift items' },
      },
    },
    {
      cohortId: 'cohort-target-006',
      label: 'Business Buyer Bulk Researcher',
      cohortType: 'business-buyer',
      behavioralOverlay: 'bulk-researcher',
      baseSku: 'SKU-6571042',
      priority: 6,
      behavioralOverlays: ['session_depth', 'category_affinity'],
      tailoringEmphasis: {
        price: { weight: 75, strategy: 'Show volume pricing and business account discounts' },
        description: {
          weight: 90,
          strategy: 'Emphasize enterprise features, manageability, and support',
        },
        warranty: { weight: 85, strategy: 'Highlight extended business warranty options' },
        fulfillment: { weight: 70, strategy: 'Show bulk order delivery timelines' },
      },
    },
    {
      cohortId: 'cohort-target-007',
      label: 'Student Budget Deal Seeker',
      cohortType: 'student',
      behavioralOverlay: 'deal-seeker',
      baseSku: 'SKU-6534512',
      priority: 7,
      behavioralOverlays: ['price_sensitivity', 'device_type'],
      tailoringEmphasis: {
        price: { weight: 95, strategy: 'Show student discounts and education pricing' },
        promotion: { weight: 85, strategy: 'Feature back-to-school bundles and trade-in offers' },
        description: { weight: 60, strategy: 'Highlight study and productivity use cases' },
        accessories: { weight: 70, strategy: 'Recommend student essentials like cases and styluses' },
      },
    },
    {
      cohortId: 'cohort-target-008',
      label: 'High-Value Customer Brand Loyalist',
      cohortType: 'high-value',
      behavioralOverlay: 'brand-loyalist',
      baseSku: 'SKU-6563925',
      priority: 8,
      behavioralOverlays: ['brand_loyalty', 'purchase_frequency'],
      tailoringEmphasis: {
        media: { weight: 85, strategy: 'Show premium lifestyle imagery and unboxing content' },
        badge: { weight: 90, strategy: 'Display VIP exclusive and early-access badges' },
        title: { weight: 60, strategy: 'Personalize title with premium positioning' },
        warranty: { weight: 80, strategy: 'Offer premium protection and concierge support' },
      },
    },
    {
      cohortId: 'cohort-target-009',
      label: 'Bargain Seeker Comparison Shopper',
      cohortType: 'bargain-seeker',
      behavioralOverlay: 'comparison-shopper',
      baseSku: 'SKU-6505727',
      priority: 9,
      behavioralOverlays: ['price_sensitivity', 'session_depth'],
      tailoringEmphasis: {
        price: { weight: 95, strategy: 'Show price-match guarantee and lowest-price callouts' },
        promotion: { weight: 90, strategy: 'Highlight open-box deals and refurbished options' },
        rating: { weight: 75, strategy: 'Show value-for-money ratings and comparisons' },
        badge: { weight: 70, strategy: 'Display best-value and price-drop badges' },
      },
    },
    {
      cohortId: 'cohort-target-010',
      label: 'Returning Customer Quick Purchaser',
      cohortType: 'returning-customer',
      behavioralOverlay: 'quick-purchaser',
      baseSku: 'SKU-6563925',
      priority: 10,
      behavioralOverlays: ['purchase_frequency', 'cart_abandonment'],
      tailoringEmphasis: {
        fulfillment: {
          weight: 95,
          strategy: 'Show one-click reorder and fastest delivery options',
        },
        price: { weight: 70, strategy: 'Display loyalty points balance and earning potential' },
        accessories: {
          weight: 80,
          strategy: 'Recommend based on previous purchase history',
        },
        badge: { weight: 65, strategy: 'Show returning-customer welcome-back badges' },
      },
    },
  ],
  createdAt: '2024-06-10T12:00:00Z',
  updatedAt: '2024-06-10T12:00:00Z',
};

export default defaultCohorts;