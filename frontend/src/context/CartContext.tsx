"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  fabric: string;
  selectedSize: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQty: (id: string, size: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  grandTotal: number;
  activeCoupon: { code: string; percent?: number; flatVal?: number } | null;
  applyCoupon: (code: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<CartContextType['activeCoupon']>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem('kalankari_prod_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('kalankari_prod_cart', JSON.stringify(newCart));
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    const existing = cart.findIndex(i => i.id === item.id && i.selectedSize === item.selectedSize);
    let newCart = [...cart];
    
    if (existing > -1) {
      newCart[existing].quantity += qty;
    } else {
      newCart.push({ ...item, quantity: qty });
    }
    saveCart(newCart);

    // ==========================================
    // META DATASET (PIXEL) TRACKING ADDED HERE
    // ==========================================
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        content_ids: [item.id],
        content_name: item.name,
        content_type: 'product',
        value: item.price * qty,
        currency: 'INR'
      });
    }
    // ==========================================
  };

  const removeFromCart = (id: string, size: string) => {
    const newCart = cart.filter(i => !(i.id === id && i.selectedSize === size));
    saveCart(newCart);
  };

  const updateQty = (id: string, size: string, qty: number) => {
    const existing = cart.findIndex(i => i.id === id && i.selectedSize === size);
    if (existing > -1) {
      let newCart = [...cart];
      newCart[existing].quantity = Math.max(1, qty);
      saveCart(newCart);
    }
  };

  const clearCart = () => {
    saveCart([]);
    setActiveCoupon(null);
  };

  const applyCoupon = (code: string): boolean => {
    const upperCode = code.toUpperCase();
    if (upperCode === 'ART10') {
      setActiveCoupon({ code: 'ART10', percent: 10 });
      return true;
    } else if (upperCode === 'GOLD20') {
      setActiveCoupon({ code: 'GOLD20', percent: 20 });
      return true;
    } else if (upperCode === 'WELCOME500') {
      setActiveCoupon({ code: 'WELCOME500', flatVal: 500 });
      return true;
    }
    return false;
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.percent) {
      discount = Math.round(subtotal * (activeCoupon.percent / 100));
    } else if (activeCoupon.flatVal) {
      discount = activeCoupon.flatVal;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = 0;
  
  const shipping = 0;
  const grandTotal = taxableAmount + shipping;

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty, clearCart,
      subtotal, tax, shipping, discount, grandTotal, activeCoupon, applyCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};