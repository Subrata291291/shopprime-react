import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Product, CartItem } from '../types';

// ─── State ────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

// ─── Actions ──────────────────────────────────────────────────────────────────
type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; color?: string; size?: string } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QTY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD'; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'LOAD':
      return { items: action.payload };

    case 'ADD_ITEM': {
      const { product, quantity = 1, color, size } = action.payload;
      const existing = state.items.find(
        (i) => i.product.id === product.id && i.selectedColor === color && i.selectedSize === size
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id && i.selectedColor === color && i.selectedSize === size
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { product, quantity, selectedColor: color, selectedSize: size }],
      };
    }

    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.product.id !== action.payload) };

    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.product.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
        ),
      };

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'shopprime_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    subtotal,
    addToCart: (product, quantity = 1, color, size) =>
      dispatch({ type: 'ADD_ITEM', payload: { product, quantity, color, size } }),
    removeFromCart: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
    updateQuantity: (id, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { id, quantity } }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    isInCart: (id) => state.items.some((i) => i.product.id === id),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
