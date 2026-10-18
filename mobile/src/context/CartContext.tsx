import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../api";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "@medax_cart_items";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((data) => {
      if (data) {
        try {
          setItems(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(newItems));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      saveCart([...items, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: number) => {
    saveCart(items.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const price = typeof i.product.priceFrom === "number" ? i.product.priceFrom : parseFloat(String(i.product.priceFrom || 0));
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
