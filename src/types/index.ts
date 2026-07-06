// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  badgeType?: 'sale' | 'new' | 'trending' | 'hot' | 'limited' | 'top-rated' | 'best-seller' | 'pre-order';
  category: string;
  categoryId?: number;
  categoryIds?: number[];
  brand?: string;
  description?: string;
  highlights?: string[];
  specs?: { label: string; value: string }[];
  inStock?: boolean;
  isPreOrder?: boolean;
  colors?: string[];
  sizes?: string[];
  sku?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export type WishlistItem = Product;

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface ShopFilters {
  category: string;
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'rating';
}

// ─── Order ─────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: CartItem[];
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}
