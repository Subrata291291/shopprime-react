import axios from 'axios';
import config, { isWpConfigured } from '../config';
import type { Product, ShopFilters } from '../types';
import { MOCK_PRODUCTS, CATEGORIES, BRANDS, MAX_PRICE } from '../data/products';
import { mockUser, mockOrders, mockWishlist, mockAddresses, mockPayments } from '../data/mock';

const wpApi = axios.create({
  baseURL: config.wpUrl ? `${config.wpUrl}/wp-json` : '',
  timeout: 15000,
});

wpApi.interceptors.request.use((req) => {
  if (config.jwtToken) {
    req.headers.Authorization = `Bearer ${config.jwtToken}`;
  }
  if (config.wcConsumerKey && config.wcConsumerSecret && req.url?.startsWith('/wc')) {
    req.params = {
      ...req.params,
      consumer_key: config.wcConsumerKey,
      consumer_secret: config.wcConsumerSecret,
    };
  }
  return req;
});

wpApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!isWpConfigured()) return Promise.reject(err);
    console.warn('[WP API]', err.response?.status, err.config?.url);
    return Promise.reject(err);
  }
);

function wpProductToProduct(wp: any): Product {
  const meta = wp.meta_data?.reduce((acc: any, m: any) => {
    acc[m.key] = m.value;
    return acc;
  }, {}) || {};
  return {
    id: wp.id,
    name: wp.name,
    price: parseFloat(wp.price),
    originalPrice: wp.regular_price ? parseFloat(wp.regular_price) : undefined,
    image: wp.images?.[0]?.src || '',
    images: wp.images?.map((i: any) => i.src) || [],
    rating: wp.average_rating ? parseFloat(wp.average_rating) : 0,
    reviewCount: wp.rating_count || 0,
    badge: meta.badge || '',
    badgeType: meta.badge_type as any || undefined,
    category: wp.categories?.[0]?.name || 'General',
    brand: meta.brand || wp.brands?.[0]?.name || '',
    description: wp.short_description?.replace(/<[^>]+>/g, '') || '',
    inStock: wp.stock_status === 'instock',
    isPreOrder: wp.stock_status === 'onbackorder',
    colors: meta.colors ? JSON.parse(meta.colors) : undefined,
    sizes: meta.sizes ? JSON.parse(meta.sizes) : undefined,
    sku: wp.sku || undefined,
  };
}

function mapStatus(status: string): 'Ordered' | 'Shipped' | 'In Transit' | 'Delivered' {
  switch (status) {
    case 'pending': case 'processing': return 'Ordered';
    case 'completed': return 'Delivered';
    default: return 'Shipped';
  }
}

export const wpService = {
  // ─── Products ──────────────────────────────────────────────────────
  async getProducts(filters?: Partial<ShopFilters>): Promise<Product[]> {
    if (!isWpConfigured()) {
      let result = [...MOCK_PRODUCTS];
      if (filters?.category && filters.category !== 'All') {
        result = result.filter(p => p.category === filters.category);
      }
      if (filters?.brands?.length) {
        result = result.filter(p => p.brand && filters.brands!.includes(p.brand));
      }
      if (filters?.maxPrice && filters.maxPrice < MAX_PRICE) {
        result = result.filter(p => p.price <= filters.maxPrice!);
      }
      if (filters?.minRating) {
        result = result.filter(p => p.rating >= filters.minRating!);
      }
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'price-asc': result.sort((a, b) => a.price - b.price); break;
          case 'price-desc': result.sort((a, b) => b.price - a.price); break;
          case 'popular': result.sort((a, b) => b.reviewCount - a.reviewCount); break;
          case 'rating': result.sort((a, b) => b.rating - a.rating); break;
        }
      }
      return result;
    }
    const params: any = { per_page: 100 };
    if (filters?.category && filters.category !== 'All') {
      params.category = filters.category;
    }
    if (filters?.maxPrice && filters.maxPrice < MAX_PRICE) {
      params.max_price = filters.maxPrice;
    }
    if (filters?.minRating) {
      params.min_rating = filters.minRating;
    }
    if (filters?.sortBy) {
      const sortMap: Record<string, string> = {
        'price-asc': 'price', 'price-desc': 'price-desc',
        'popular': 'popularity', 'rating': 'rating',
        'newest': 'date', 'relevance': 'relevance',
      };
      params.orderby = sortMap[filters.sortBy] || 'relevance';
      if (filters.sortBy === 'price-asc') params.order = 'asc';
      if (filters.sortBy === 'price-desc') params.order = 'desc';
    }
    const { data } = await wpApi.get('/wc/v3/products', { params });
    return data.map(wpProductToProduct);
  },

  async getProduct(id: number): Promise<Product | null> {
    if (!isWpConfigured()) {
      return MOCK_PRODUCTS.find(p => p.id === id) || null;
    }
    try {
      const { data } = await wpApi.get(`/wc/v3/products/${id}`);
      return wpProductToProduct(data);
    } catch {
      return null;
    }
  },

  async getRelatedProducts(id: number, limit = 5): Promise<Product[]> {
    if (!isWpConfigured()) {
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      if (!product) return [];
      const related = MOCK_PRODUCTS.filter(p => p.category === product.category && p.id !== id);
      return related.sort(() => Math.random() - 0.5).slice(0, limit);
    }
    const product = await this.getProduct(id);
    if (!product) return [];
    const { data } = await wpApi.get('/wc/v3/products', {
      params: { category: product.category, exclude: id, per_page: limit },
    });
    return data.map(wpProductToProduct);
  },

  async getCategories(): Promise<string[]> {
    if (!isWpConfigured()) return CATEGORIES;
    const { data } = await wpApi.get('/wc/v3/products/categories', { params: { per_page: 100 } });
    return ['All', ...data.map((c: any) => c.name)];
  },

  async getBrands(): Promise<string[]> {
    if (!isWpConfigured()) return BRANDS;
    try {
      const { data } = await wpApi.get('/wc/v3/products/brands', { params: { per_page: 100 } });
      return data.map((b: any) => b.name);
    } catch {
      return [];
    }
  },

  // ─── Orders ─────────────────────────────────────────────────────────
  async getOrders(): Promise<any[]> {
    if (!isWpConfigured()) {
      return [];
    }
    const { data } = await wpApi.get('/wc/v3/orders', { params: { per_page: 50 } });
    return data.map((o: any) => ({
      id: o.number ? `#${o.number}` : o.id,
      date: new Date(o.date_created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      total: parseFloat(o.total),
      subtotal: parseFloat(o.total) - parseFloat(o.total_tax || '0'),
      shipping: parseFloat(o.shipping_total) || 'FREE',
      status: mapStatus(o.status),
      items: o.line_items.map((li: any) => ({
        id: li.product_id,
        name: li.name,
        image: li.image?.src || '',
        qty: li.quantity,
        variant: li.meta_data?.find((m: any) => m.key === 'Color')?.value || '',
        price: parseFloat(li.price),
      })),
      lastSeenPlace: o.status === 'completed' ? 'Delivered' : 'Processing',
      lastSeenTime: new Date(o.date_modified).toLocaleString(),
      activity: [
        { time: `Order placed ${new Date(o.date_created).toLocaleString()}`, desc: 'Payment confirmed', type: 'primary', icon: 'bi-check-circle' },
        { time: `Status: ${o.status}`, desc: o.status === 'completed' ? 'Delivery completed' : 'In progress', type: 'secondary', icon: 'bi-circle-fill' },
      ],
    }));
  },

  async getOrder(orderId: string): Promise<any> {
    if (!isWpConfigured()) {
      return mockOrders.find((o) => o.id === orderId) || null;
    }
    const id = orderId.replace('#', '');
    const { data } = await wpApi.get(`/wc/v3/orders/${id}`);
    return {
      id: data.number ? `#${data.number}` : data.id,
      date: new Date(data.date_created).toLocaleDateString(),
      estimatedDelivery: '',
      total: parseFloat(data.total),
      subtotal: parseFloat(data.total) - parseFloat(data.total_tax || '0'),
      shipping: parseFloat(data.shipping_total) || 'FREE',
      status: mapStatus(data.status),
      items: data.line_items.map((li: any) => ({
        id: li.product_id,
        name: li.name,
        image: li.image?.src || '',
        qty: li.quantity,
        variant: '',
        price: parseFloat(li.price),
      })),
      lastSeenPlace: '',
      lastSeenTime: '',
      activity: [],
    };
  },

  async createOrder(orderData: any): Promise<any> {
    if (!isWpConfigured()) {
      return { id: `SP-${Math.floor(100000 + Math.random() * 900000)}`, ...orderData };
    }
    const { data } = await wpApi.post('/wc/v3/orders', {
      payment_method: 'stripe',
      payment_method_title: 'Credit Card',
      set_paid: false,
      billing: { first_name: 'Guest', last_name: 'User', email: 'guest@example.com' },
      shipping: { first_name: 'Guest', last_name: 'User' },
      line_items: orderData.items?.map((item: any) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })) || [],
    });
    return { id: data.number ? `#${data.number}` : data.id, ...orderData };
  },

  // ─── Auth / Customer ────────────────────────────────────────────────
  async register(username: string, email: string, password: string): Promise<{ token: string; user: any } | null> {
    if (!isWpConfigured()) {
      return { token: 'mock-token', user: { ...mockUser, name: username, email } };
    }
    try {
      const { data } = await wpApi.post('/wp/v2/users/register', { username, email, password });
      return { token: data.token || '', user: data.user || { name: username, email } };
    } catch {
      try {
        const { data } = await wpApi.post('/wp/v2/users', { username, email, password });
        return { token: '', user: { id: data.id, name: data.name, email: data.email } };
      } catch {
        return null;
      }
    }
  },

  async login(username: string, password: string): Promise<{ token: string; user: any } | null> {
    if (!isWpConfigured()) {
      return { token: 'mock-token', user: mockUser };
    }
    try {
      const { data } = await wpApi.post('/jwt-auth/v1/token', { username, password });
      config.jwtToken = data.token;
      return { token: data.token, user: data.user };
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<any> {
    if (!isWpConfigured()) {
      return mockUser;
    }
    try {
      const { data } = await wpApi.get('/wc/v3/customers/me');
      return {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`.trim() || data.username,
        email: data.email,
        avatar: data.avatar_url || '',
      };
    } catch {
      const { data } = await wpApi.get('/wp/v2/users/me');
      return { id: data.id, name: data.name, email: data.email, avatar: data.avatar_urls?.['96'] || '' };
    }
  },

  // ─── Customer Data ──────────────────────────────────────────────────
  async getAddresses(): Promise<any[]> {
    if (!isWpConfigured()) {
      return mockAddresses;
    }
    try {
      const { data } = await wpApi.get('/wc/v3/customers/me');
      const shipping = data.shipping;
      if (shipping?.address_1) {
        return [{
          id: 1, name: `${data.first_name} ${data.last_name}`.trim(),
          tags: shipping.address_2 ? ['Default', 'Home'] : ['Default'],
          line1: shipping.address_1,
          line2: shipping.address_2 || shipping.city || '',
          country: shipping.country || '',
          phone: data.billing?.phone || '',
        }];
      }
      return [];
    } catch {
      return [];
    }
  },

  async getPayments(): Promise<any[]> {
    if (!isWpConfigured()) {
      return mockPayments;
    }
    return [];
  },

  async getWishlist(): Promise<any[]> {
    if (!isWpConfigured()) {
      return mockWishlist;
    }
    return [];
  },
};
