"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [imgError, setImgError] = useState(false);
  
  const pid = (product as any)._id || product.id;
  const isWishlisted = isInWishlist(pid);

  const isPlaceholder = (url: string) => {
    if (!url) return true;
    return url.includes("unsplash.com") || url.includes("placeholder");
  };

  const hasImage = product.images && product.images[0] && !isPlaceholder(product.images[0]) && !imgError;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: pid,
      name: product.name,
      price: product.price,
      image: hasImage ? product.images[0] : ""
    });
  };

  return (
    <div className="bg-white dark:bg-[#121111] shadow-sm border border-gray-100 dark:border-gray-900 rounded-lg group overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-md">
      <div className="aspect-[3/4] overflow-hidden relative bg-gray-50 dark:bg-zinc-900 cursor-pointer">
        <Link href={`/shop/${pid}`} className="w-full h-full block">
          {hasImage ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 will-change-transform"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-400 font-body select-none">
              <span>No Image Available</span>
            </div>
          )}
        </Link>

        {product.isBestSeller && (
          <div className="absolute top-3 left-3 bg-primary text-white text-[9px] sm:text-[10px] uppercase font-bold px-2.5 py-0.5 rounded tracking-wider shadow-sm z-10">
            Best Seller
          </div>
        )}
        {!product.isBestSeller && product.isNewArrival && (
          <div className="absolute top-3 left-3 bg-secondary text-white text-[9px] sm:text-[10px] uppercase font-bold px-2.5 py-0.5 rounded tracking-wider shadow-sm z-10">
            New
          </div>
        )}
        {product.originalPrice > product.price && (
          <div className="absolute bottom-3 left-3 bg-green-600 text-white text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider shadow-sm z-10">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}

        <button 
          onClick={handleWishlistToggle} 
          className="absolute top-3 right-3 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black w-8 h-8 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400 transition-colors shadow-sm z-10" 
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={14} fill={isWishlisted ? "#8B2635" : "none"} className={isWishlisted ? "text-primary border-none" : "text-gray-700 dark:text-gray-200"} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow gap-1 text-left justify-between">
        <div>
          <span className="text-[9px] sm:text-[10px] uppercase text-secondary font-bold tracking-wider">
            {product.category}
          </span>
          <Link href={`/shop/${pid}`} className="block font-semibold text-sm hover:text-primary transition-colors text-gray-800 dark:text-gray-200 line-clamp-1 mt-0.5">
            {product.name}
          </Link>
          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
            {product.fabric}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-gray-50 dark:border-zinc-900">
          <span className="font-bold text-primary dark:text-secondary text-sm">
            ₹{product.price}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
