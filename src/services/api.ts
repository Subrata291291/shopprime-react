import { isWpConfigured } from '../config';
import { MOCK_PRODUCTS } from '../data/products';
import { mockUser, mockOrders, mockAddresses, mockPayments } from '../data/mock';
import type { MockUser, MockOrder, MockOrderItem, MockWishlistItem, MockAddress, MockPayment } from '../data/mock';
import { wpService } from './wp';
import type { ShopFilters } from '../types';

export type User = MockUser;
export type Order = MockOrder;
export type WishlistItem = MockWishlistItem;
export type Address = MockAddress;
export type Payment = MockPayment;

function delay<T>(data: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(data), 200));
}

export const api = {
  // ─── Products ──────────────────────────────────────────────────────
  getProducts: async (filters?: Partial<ShopFilters>) => {
    return wpService.getProducts(filters);
  },

  getProduct: async (id: number) => {
    if (isWpConfigured()) return wpService.getProduct(id);
    return delay(MOCK_PRODUCTS.find(p => p.id === id) || null);
  },

  getRelatedProducts: async (id: number, limit = 5) => {
    if (isWpConfigured()) return wpService.getRelatedProducts(id, limit);
    return delay(
      (() => {
        const product = MOCK_PRODUCTS.find(p => p.id === id);
        if (!product) return [];
        return MOCK_PRODUCTS.filter(p => p.category === product.category && p.id !== id)
          .sort(() => Math.random() - 0.5).slice(0, limit);
      })()
    );
  },

  // ─── Auth / User ────────────────────────────────────────────────────
  login: async (username: string, password: string) => {
    if (isWpConfigured()) return wpService.login(username, password);
    return delay({ token: 'mock-token', user: mockUser });
  },

  register: async (username: string, email: string, password: string) => {
    if (isWpConfigured()) return wpService.register(username, email, password);
    return delay({ token: 'mock-token', user: { ...mockUser, name: username, email } });
  },

  getUser: async (): Promise<User> => {
    if (isWpConfigured()) return wpService.getCurrentUser();
    return delay(mockUser);
  },

  // ─── Orders ─────────────────────────────────────────────────────────
  getOrders: async (): Promise<Order[]> => {
    if (isWpConfigured()) return wpService.getOrders();
    return delay(mockOrders);
  },

  getOrder: async (orderId: string): Promise<Order | undefined> => {
    if (isWpConfigured()) return wpService.getOrder(orderId);
    return delay(mockOrders.find((o) => o.id === orderId));
  },

  createOrder: async (orderData: any) => {
    if (isWpConfigured()) return wpService.createOrder(orderData);

    const normalizeItem = (item: any): MockOrderItem => ({
      id: typeof item.id === 'number' ? item.id : item.product?.id ?? Date.now(),
      name: item.name ?? item.product?.name ?? 'Product',
      image: item.image ?? item.product?.image ?? '',
      qty: item.qty ?? item.quantity ?? 1,
      variant: item.variant ?? item.selectedColor ?? 'Standard',
      price: item.price ?? item.product?.price ?? 0,
    });

    const newOrder: MockOrder = {
      id: `SP-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      total: orderData.total ?? 0,
      subtotal: orderData.subtotal ?? 0,
      shipping: orderData.shipping ?? orderData.shippingCost ?? 'FREE',
      shippingMethod: orderData.shippingMethod ?? ((orderData.shippingCost ?? 0) > 0 ? 'Express Delivery' : 'Standard Shipping'),
      tax: orderData.tax ?? 0,
      paymentMethod: orderData.paymentMethod ?? 'Credit / Debit Card',
      paymentBrand: orderData.paymentBrand ?? 'Card',
      billingNote: orderData.billingNote ?? `Paid via ${orderData.paymentBrand ?? 'Card'}`,
      shippingAddress: orderData.shippingAddress ?? {
        name: orderData.name ?? 'Guest User',
        address: orderData.address ?? 'Guest Address',
        city: orderData.city ?? 'City',
        country: orderData.country ?? 'United States',
      },
      status: orderData.status ?? 'Ordered',
      items: Array.isArray(orderData.items) ? orderData.items.map(normalizeItem) : [],
      lastSeenPlace: 'Order received at warehouse',
      lastSeenTime: 'Just now',
      activity: [
        { time: 'Just now', desc: 'Order confirmed and received', type: 'primary', icon: 'bi-check-lg' },
        { time: 'Packing', desc: 'Your order is being packed', type: 'secondary', icon: 'bi-box-seam' },
        { time: 'Ready for dispatch', desc: 'Shipment will leave soon', type: 'secondary', icon: 'bi-truck' },
      ],
    };

    mockOrders.unshift(newOrder);
    return delay(newOrder);
  },

  // ─── Customer Data ──────────────────────────────────────────────────
  getWishlist: async (): Promise<WishlistItem[]> => {
    if (isWpConfigured()) return wpService.getWishlist();
    return delay([]);
  },

  getAddresses: async (): Promise<Address[]> => {
    if (isWpConfigured()) return wpService.getAddresses();
    return delay(mockAddresses);
  },

  getPayments: async (): Promise<Payment[]> => {
    if (isWpConfigured()) return wpService.getPayments();
    return delay(mockPayments);
  },
};
