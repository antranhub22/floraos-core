/**
 * @/lib/product-filter — SSOT cho hệ thống Lọc & Tìm kiếm Sản phẩm FloraOS
 *
 * Import từ đây thay vì import trực tiếp từ file con.
 *
 * @example
 * import { filterProducts, rankProducts, matchCategory } from "@/lib/product-filter"
 * import type { ProductFilterCriteria, FilterableProduct } from "@/lib/product-filter"
 */

// Types
export type {
  PriceRange,
  ProductFilterCriteria,
  FilterableProduct,
  ScoredProduct,
} from "./product-filter-types"

// Maps & canonical helpers
export {
  CATEGORY_CANONICAL,
  categoryCanonical,
  getCategoryVariants,
  OCCASION_SLUG_MAP,
  OCCASION_NAME_KEYWORDS,
  FLOWER_NAME_KEYWORDS,
  COLOR_SLUG_MAP,
  COLOR_NAME_KEYWORDS,
} from "./product-filter-maps"

// Engine functions
export {
  matchPriceRange,
  matchCategory,
  matchOccasion,
  matchFlowerType,
  matchColorTone,
  matchSearch,
  filterProducts,
  scoreProduct,
  rankProducts,
} from "./product-filter-engine"

// Khoảng giá lọc nhanh — một bộ chung cho mọi màn tìm/lọc, mỗi cửa hàng tự cấu hình
export {
  PRICE_BUDGETS_SETTINGS_KEY,
  MAX_PRICE_BUDGETS,
  DEFAULT_PRICE_BUDGETS,
  formatPriceShort,
  defaultBudgetLabel,
  readPriceBudgets,
  priceBudgetErrors,
  serializePriceBudgets,
  generatePriceBudgets,
  toInclusiveRange,
  inPriceBudget,
} from "./price-budgets"
export type { PriceBudget } from "./price-budgets"
