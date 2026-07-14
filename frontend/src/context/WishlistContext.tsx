"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('kalankari_prod_wishlist');
    if (stored) {
      setWishlist(JSON.parse(stored));
    }
  }, []);

  const saveWishlist = (newWishlist: WishlistItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('kalankari_prod_wishlist', JSON.stringify(newWishlist));
  };

  const toggleWishlist = (item: WishlistItem) => {
    const existingIdx = wishlist.findIndex(i => i.id === item.id);
    let newWishlist = [...wishlist];
    
    if (existingIdx > -1) {
      newWishlist.splice(existingIdx, 1);
    } else {
      newWishlist.push(item);
    }
    saveWishlist(newWishlist);
  };

  const isInWishlist = (id: string): boolean => {
    return wishlist.some(i => i.id === id);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
