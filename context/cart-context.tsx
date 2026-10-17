"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { UnitType } from "@prisma/client";

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  unitType: UnitType;
  minOrderQty: number;
  maxStock: number | null;
  imageUrl: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "sporeerp_cart_v1";
const FREE_DELIVERY_THRESHOLD = 500;
const STANDARD_DELIVERY_FEE = 50;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore JSON parse or storage access errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable
    }
  }, [items, isHydrated]);

  const addItem = (newItem: Omit<CartItem, "quantity">, quantityToAdd?: number) => {
    const qty = quantityToAdd ?? newItem.minOrderQty;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        const updatedQty = existing.quantity + qty;
        const finalQty =
          newItem.maxStock !== null ? Math.min(updatedQty, newItem.maxStock) : updatedQty;
        return prev.map((i) =>
          i.productId === newItem.productId ? { ...i, quantity: finalQty } : i,
        );
      }
      return [...prev, { ...newItem, quantity: qty }];
    });
    setIsDrawerOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) => {
        if (i.productId !== productId) return i;
        const finalQty = i.maxStock !== null ? Math.min(quantity, i.maxStock) : quantity;
        return { ...i, quantity: finalQty };
      });
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity > 0 ? 1 : 0), 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + Math.round(item.price * item.quantity * 100) / 100;
      }, 0),
    [items],
  );

  const deliveryFee = useMemo(() => {
    if (items.length === 0 || subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
    return STANDARD_DELIVERY_FEE;
  }, [items.length, subtotal]);

  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        itemCount,
        subtotal,
        deliveryFee,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
