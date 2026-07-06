// ─── Types ─────────────────────────────────────────────────────────────────
export type MockUser = {
  id?: number;
  name: string;
  email: string;
  avatar: string;
};

export type MockOrderItem = {
  id: number;
  name: string;
  image: string;
  qty: number;
  variant: string;
  price: number;
};

export type MockActivityItem = {
  time: string;
  desc: string;
  type: 'primary' | 'secondary';
  icon: string;
};

export type MockOrder = {
  id: string;
  date: string;
  estimatedDelivery: string;
  total: number;
  subtotal: number;
  shipping: number | 'FREE';
  shippingMethod?: string;
  tax: number;
  paymentMethod: string;
  paymentBrand: string;
  billingNote: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
  status: 'Ordered' | 'Shipped' | 'In Transit' | 'Delivered';
  items: MockOrderItem[];
  lastSeenPlace: string;
  lastSeenTime: string;
  activity: MockActivityItem[];
};

export type MockWishlistItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  stock: 'in' | 'low' | 'out';
  badge?: 'price-drop' | 'best-seller' | 'trending';
  rating: number;
  ratingCount: number;
};

export type MockAddress = {
  id: number;
  name: string;
  tags: string[];
  line1: string;
  line2: string;
  country: string;
  phone: string;
};

export type MockPayment = {
  id: number;
  type: string;
  last4: string;
  expires: string;
  default: boolean;
};

// ─── Mock Data ──────────────────────────────────────────────────────────────
export const mockUser: MockUser = {
  name: 'Subrata Haldar',
  email: 'subrata291291@gmail.com',
  avatar: 'https://i.pravatar.cc/150?img=5',
};

export const mockOrders: MockOrder[] = [
  {
    id: 'SP-98231',
    date: 'Oct 24, 2023',
    estimatedDelivery: 'Thursday, Oct 28, 2023',
    total: 748.00,
    subtotal: 748.00,
    shipping: 'FREE',
    status: 'In Transit',
    items: [
      { id: 1, name: 'PrimeX Wireless Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80', qty: 1, variant: 'Midnight Black', price: 299.00 },
      { id: 2, name: 'TechMaster 4K Monitor', image: 'https://images.unsplash.com/photo-1527443224154-c4a573d5f5ec?auto=format&fit=crop&w=100&q=80', qty: 1, variant: 'Ultra-Wide 32"', price: 449.00 },
    ],
    shippingMethod: 'Standard Shipping',
    tax: 0,
    paymentMethod: 'Credit / Debit Card',
    paymentBrand: 'Visa',
    billingNote: 'Paid via Visa',
    shippingAddress: {
      name: 'Alex Johnson',
      address: '248 Luxury Avenue, Suite 1200',
      city: 'Manhattan, NY 10001',
      country: 'United States',
    },
    lastSeenPlace: 'Regional Sorting Facility, North District',
    lastSeenTime: 'Updated 12 mins ago',
    activity: [
      { time: '10:30 AM: Package arrived at local facility', desc: 'Sorting and dispatch preparation', type: 'primary', icon: 'bi-truck' },
      { time: '08:15 AM: Departed distribution center', desc: 'In transit to regional hub', type: 'secondary', icon: 'bi-circle-fill' },
      { time: '04:00 AM: Processed through sorting center', desc: 'Main sorting hub - West Point', type: 'secondary', icon: 'bi-circle-fill' },
    ],
  },
  {
    id: 'SP-97120', date: 'Oct 12, 2023', estimatedDelivery: 'Thursday, Oct 16, 2023',
    total: 45.50, subtotal: 45.50, shipping: 'FREE', shippingMethod: 'Standard Shipping', tax: 0, status: 'Delivered',
    paymentMethod: 'Credit / Debit Card',
    paymentBrand: 'Mastercard',
    billingNote: 'Paid via Mastercard',
    shippingAddress: {
      name: 'Alex Johnson',
      address: '4500 Innovation Way',
      city: 'San Francisco, CA 94105',
      country: 'United States',
    },
    items: [{ id: 3, name: 'USB-C Hub Pro', image: 'https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?auto=format&fit=crop&w=100&q=80', qty: 1, variant: 'Space Gray', price: 45.50 }],
    lastSeenPlace: 'Delivered to front door', lastSeenTime: 'Oct 16, 2:30 PM',
    activity: [
      { time: '02:30 PM: Package delivered', desc: 'Left at front door', type: 'primary', icon: 'bi-house-door' },
      { time: '09:00 AM: Out for delivery', desc: 'Driver en route', type: 'secondary', icon: 'bi-circle-fill' },
    ],
  },
  {
    id: 'SP-95804', date: 'Sep 28, 2023', estimatedDelivery: 'Wednesday, Oct 2, 2023',
    total: 220.00, subtotal: 220.00, shipping: 'FREE', shippingMethod: 'Standard Shipping', tax: 0, status: 'Delivered',
    paymentMethod: 'Credit / Debit Card',
    paymentBrand: 'Visa',
    billingNote: 'Paid via Visa',
    shippingAddress: {
      name: 'Alex Johnson',
      address: '248 Luxury Avenue, Suite 1200',
      city: 'Manhattan, NY 10001',
      country: 'United States',
    },
    items: [{ id: 4, name: 'Mechanical Keyboard TKL', image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=100&q=80', qty: 1, variant: 'Red Switches', price: 220.00 }],
    lastSeenPlace: 'Delivered to mailbox', lastSeenTime: 'Oct 2, 11:15 AM',
    activity: [
      { time: '11:15 AM: Package delivered', desc: 'Left in mailbox', type: 'primary', icon: 'bi-mailbox' },
      { time: '08:00 AM: Out for delivery', desc: 'Driver en route', type: 'secondary', icon: 'bi-circle-fill' },
    ],
  },
];

export const mockWishlist: MockWishlistItem[] = [
  {
    id: 1,
    name: 'Apex Wireless Pro',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
    price: 299,
    oldPrice: 349,
    stock: 'in',
    badge: 'price-drop',
    rating: 5,
    ratingCount: 482,
  },
  {
    id: 2,
    name: 'Keychron Q1 Pro',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80',
    price: 189,
    stock: 'low',
    badge: 'best-seller',
    rating: 5,
    ratingCount: 1204,
  },
  {
    id: 3,
    name: 'Logitech MX Master 3S',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80',
    price: 99.99,
    stock: 'in',
    badge: 'trending',
    rating: 4,
    ratingCount: 850,
  },
  {
    id: 4,
    name: 'Sony Alpha 7 IV',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
    price: 2499,
    stock: 'out',
    rating: 5,
    ratingCount: 240,
  },
];

export const mockAddresses: MockAddress[] = [
  { id: 1, name: 'Alex Rivers', tags: ['Default', 'Home'], line1: '248 Luxury Avenue, Suite 1200', line2: 'Manhattan, NY 10001', country: 'United States', phone: '+1 (555) 012-3456' },
  { id: 2, name: 'Alex Rivers', tags: ['Office'], line1: 'Quantum Tech Park, Tower B', line2: '4500 Innovation Way, San Francisco, CA 94105', country: '', phone: '+1 (555) 987-6543' },
];

export const mockPayments: MockPayment[] = [
  { id: 1, type: 'Visa', last4: '4242', expires: '09/26', default: true },
  { id: 2, type: 'Mastercard', last4: '8891', expires: '03/25', default: false },
];
