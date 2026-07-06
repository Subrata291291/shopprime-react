import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import type { Product } from '../types';

interface WishlistContextValue {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: number) => boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = 'shopprime_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === product.id)) return prev;
      toast.success(`${product.name} added to wishlist`);
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.info('Removed from wishlist');
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        toast.info('Removed from wishlist');
        return prev.filter((i) => i.id !== product.id);
      }
      toast.success(`${product.name} added to wishlist`);
      return [...prev, product];
    });
  }, []);

  const isInWishlist = (id: number) => items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider
      value={{ items, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, itemCount: items.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
