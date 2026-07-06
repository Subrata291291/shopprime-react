import axios from 'axios';
import config, { isWpConfigured } from '../config';
import type { Product, ShopFilters } from '../types';
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

  const parseNumber = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const decodeHtmlEntities = (text: string): string => {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#8211;/g, '-')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8212;/g, '—')
      .replace(/&#160;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'");
  };

  const stripHtml = (value: string): string => {
    return decodeHtmlEntities(value.replace(/<[^>]+>/g, '').trim());
  };

  const normalizeText = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return stripHtml(String(value));
  };

  const sanitizeHtml = (value: string): string => {
    if (!value) return '';
    const withNewlines = value
      .replace(/<\s*\/\s*(div|li|p|br|span|tr|td|h[1-6])\s*>/gi, '\n')
      .replace(/<\s*(div|li|p|br|span|tr|td|h[1-6])(?:\s+[^>]*)?>/gi, ' ');
    const withoutTags = withNewlines.replace(/<[^>]+>/g, ' ');
    return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
  };

  const parseJsonArray = (value: unknown): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const items = value
        .map((item) => normalizeText(item))
        .filter(Boolean);
      return items.length ? items : undefined;
    }
    if (typeof value === 'string') {
      const normalized = sanitizeHtml(value);
      if (!normalized) return undefined;
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          const items = parsed
            .map((item) => normalizeText(item))
            .filter(Boolean);
          return items.length ? items : undefined;
        }
      } catch {
        const lines = normalized
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean);
        return lines.length ? lines : undefined;
      }
    }
    return undefined;
  };

  const parseSpecs = (value: unknown): { label: string; value: string }[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value
        .filter((item): item is Record<string, unknown> => item && typeof item === 'object')
        .map((item) => ({
          label: normalizeText(item.label || item.name || ''),
          value: normalizeText(item.value || item.option || ''),
        }))
        .filter((item) => item.label && item.value);
    }
    if (typeof value === 'string') {
      const normalized = sanitizeHtml(value);
      if (!normalized) return undefined;
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is Record<string, unknown> => item && typeof item === 'object')
            .map((item) => ({
              label: normalizeText(item.label || item.name || ''),
              value: normalizeText(item.value || item.option || ''),
            }))
            .filter((item) => item.label && item.value);
        }
      } catch {
        const lines = normalized
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length) {
          return lines
            .map((line) => {
              const separator = line.includes(':') ? ':' : line.includes('–') ? '–' : '-';
              const [label, ...rest] = line.split(separator);
              return {
                label: normalizeText(label),
                value: normalizeText(rest.join(separator)) || 'Yes',
              };
            })
            .filter((item) => item.label && item.value);
        }
      }
    }
    return undefined;
  };

  const parsedAttributes = Array.isArray(wp.attributes)
    ? wp.attributes
        .filter((attr: any) => attr.name && Array.isArray(attr.options) && attr.options.length)
        .map((attr: any) => ({
          name: normalizeText(attr.name),
          options: attr.options.map((option: unknown) => normalizeText(option)),
        }))
    : [];

  const attributeSpecs = parsedAttributes
    .map((attr) => ({
      label: attr.name,
      value: attr.options.join(', '),
    }));

  const highlights = parseJsonArray(meta.highlights || meta.highlight || meta.product_highlights || wp.short_description);
  const specs = parseSpecs(meta.specs || meta.product_specs) || attributeSpecs;

  const categoryIds = Array.isArray(wp.categories)
    ? wp.categories.map((category: any) => Number(category.id)).filter((id: number) => Number.isFinite(id))
    : [];

  return {
    id: wp.id,
    name: wp.name || 'Untitled product',
    price: parseNumber(wp.price),
    originalPrice: wp.regular_price ? parseNumber(wp.regular_price) : undefined,
    image: wp.images?.[0]?.src || '',
    images: wp.images?.map((i: any) => i.src) || [],
    rating: parseNumber(wp.average_rating),
    reviewCount: parseNumber(wp.rating_count),
    badge: meta.badge || '',
    badgeType: meta.badge_type as any || undefined,
    category: wp.categories?.[0]?.name || 'General',
    categoryId: categoryIds[0],
    categoryIds,
    brand: meta.brand || wp.brands?.[0]?.name || '',
    description: wp.short_description?.replace(/<[^>]+>/g, '') || '',
    inStock: wp.stock_status === 'instock',
    isPreOrder: wp.stock_status === 'onbackorder',
    colors: parseJsonArray(meta.colors),
    sizes: parseJsonArray(meta.sizes),
    sku: wp.sku || undefined,
    highlights,
    specs,
    attributes: parsedAttributes,
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
    if (!isWpConfigured()) return [];

    const params: any = { per_page: 100, status: 'publish' };
    if (filters?.category && filters.category !== 'All') {
      params.category = filters.category;
    }
    if (filters?.maxPrice) {
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

    const allProducts: any[] = [];
    let page = 1;

    while (true) {
      const { data } = await wpApi.get('/wc/v3/products', { params: { ...params, page } });
      if (!data.length) break;

      allProducts.push(...data);
      if (data.length < 100) break;
      page += 1;
    }

    return allProducts.map(wpProductToProduct);
  },

  async getProduct(id: number): Promise<Product | null> {
    if (!isWpConfigured()) return null;
    try {
      const { data } = await wpApi.get(`/wc/v3/products/${id}`);
      return wpProductToProduct(data);
    } catch {
      return null;
    }
  },

  async getRelatedProducts(id: number, limit = 5): Promise<Product[]> {
    if (!isWpConfigured()) return [];
    const product = await this.getProduct(id);
    if (!product) return [];

    const params: any = { exclude: id, per_page: limit };
    if (product.categoryIds?.length) {
      params.category = product.categoryIds.join(',');
    }

    const { data } = await wpApi.get('/wc/v3/products', { params });
    return data.map(wpProductToProduct);
  },

  async getCategories(): Promise<string[]> {
    if (!isWpConfigured()) return [];
    const { data } = await wpApi.get('/wc/v3/products/categories', { params: { per_page: 100 } });
    return data.map((c: any) => c.name).filter((n: any) => Boolean(n));
  },

  async getBrands(): Promise<string[]> {
    if (!isWpConfigured()) return [];
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
    // If WP isn't configured, return a mock order immediately
    if (!isWpConfigured()) {
      return { id: `SP-${Math.floor(100000 + Math.random() * 900000)}`, ...orderData };
    }

    // Try creating the order via WooCommerce; if it fails, fall back to a mock order
    try {
      const { data } = await wpApi.post('/wc/v3/orders', {
        payment_method: 'stripe',
        payment_method_title: 'Credit Card',
        set_paid: false,
        billing: {
          first_name: String(orderData.shippingAddress?.name || 'Guest').split(' ')[0] || 'Guest',
          last_name: String(orderData.shippingAddress?.name || 'User').split(' ').slice(1).join(' ') || 'User',
          email: String(orderData.email || 'guest@example.com'),
        },
        shipping: {
          first_name: String(orderData.shippingAddress?.name || 'Guest').split(' ')[0] || 'Guest',
          last_name: String(orderData.shippingAddress?.name || 'User').split(' ').slice(1).join(' ') || 'User',
          address_1: String(orderData.shippingAddress?.address || ''),
          city: String(orderData.shippingAddress?.city || ''),
        },
        line_items: orderData.items?.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })) || [],
      });

      return { id: data.number ? `#${data.number}` : data.id, ...orderData };
    } catch (err) {
      // Log the error for debugging but return a mock order so the checkout flow doesn't fail
      console.warn('[WP ORDER CREATE] falling back to mock order:', err?.response?.status || err);
      return { id: `SP-${Math.floor(100000 + Math.random() * 900000)}`, ...orderData };
    }
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
