"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, Minus, Plus, Tag, HelpCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Cart() {
  const { 
    cart, updateQty, removeFromCart, subtotal, tax, shipping, discount, grandTotal, activeCoupon, applyCoupon 
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) return;

    const success = applyCoupon(couponCode);
    if (success) {
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code. Try WELCOME500, ART10, or GOLD20.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-screen text-left">
      <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-4 border-gray-100 dark:border-zinc-900">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-[#121111] rounded-lg border border-dashed border-gray-250 dark:border-zinc-850 max-w-2xl mx-auto px-6">
          <ShoppingBag className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" size={56} />
          <h2 className="font-headings text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Your Bag is Empty</h2>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">Explore our curated digital printed kurti collections to find your perfect style match.</p>
          <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 text-xs font-bold tracking-widest uppercase transition-colors rounded shadow inline-block">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Cart items list */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {cart.map((item) => (
              <div 
                key={`${item.id}-${item.selectedSize}`} 
                className="flex flex-col sm:flex-row gap-5 p-5 bg-white dark:bg-[#121111] border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm relative items-center text-left"
              >
                {/* Image */}
                <Link href={`/shop/${item.id}`} className="w-24 aspect-[3/4] rounded overflow-hidden bg-gray-50 dark:bg-zinc-900 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between w-full sm:w-auto h-full gap-3">
                  <div>
                    <span className="text-[9px] uppercase text-secondary font-bold tracking-wider">{item.fabric}</span>
                    <Link href={`/shop/${item.id}`} className="block font-semibold text-sm hover:text-primary transition-colors text-gray-800 dark:text-gray-100 line-clamp-2 mt-0.5">
                      {item.name}
                    </Link>
                    <div className="flex gap-4 text-[10px] text-gray-400 mt-1 font-semibold">
                      <span>Size: <span className="text-gray-700 dark:text-gray-200">{item.selectedSize}</span></span>
                      <span>•</span>
                      <span>Unit Price: <span className="text-gray-700 dark:text-gray-200">₹{item.price.toLocaleString()}</span></span>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-start gap-6 mt-1.5">
                    <div className="flex items-center border border-gray-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900">
                      <button 
                        onClick={() => updateQty(item.id, item.selectedSize, item.quantity - 1)}
                        className="px-3 py-1.5 text-gray-400 hover:text-primary transition-colors text-xs font-bold"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQty(item.id, item.selectedSize, item.quantity + 1)}
                        className="px-3 py-1.5 text-gray-400 hover:text-primary transition-colors text-xs font-bold"
                        aria-label="Increase quantity"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      className="text-gray-400 hover:text-red-500 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>

                {/* Subtotal price */}
                <div className="text-right sm:self-center w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0 flex justify-between sm:block">
                  <span className="sm:hidden text-xs text-gray-400 font-semibold">Total:</span>
                  <span className="font-bold text-primary dark:text-secondary text-base">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Back button */}
            <div className="text-left mt-2">
              <Link href="/shop" className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline flex items-center gap-1.5">
                &larr; Back to Catalog
              </Link>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Calculations Breakdown */}
            <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
              <h3 className="font-headings font-bold text-lg text-gray-800 dark:text-white border-b pb-3 mb-4">
                Order Summary
              </h3>

              <div className="flex flex-col gap-3.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString()}</span>
                </div>
                




                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-[9px] text-gray-400 leading-snug">
                    Add ₹{(1500 - subtotal).toLocaleString()} more to your cart to qualify for **Free Shipping**!
                  </p>
                )}
                
                <div className="border-t border-gray-100 dark:border-zinc-900 pt-4 flex justify-between text-xs text-gray-850 dark:text-white font-bold">
                  <span className="text-sm">Grand Total</span>
                  <span className="text-primary dark:text-secondary text-lg">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="bg-primary hover:bg-primary-hover text-white text-center py-4 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow mt-6 flex items-center justify-center gap-2 w-full uppercase"
              >
                Proceed To Checkout <ArrowRight size={14} />
              </Link>
            </div>

            {/* Help guidelines */}
            <div className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <HelpCircle size={12} />
              <span>Need help? Check our <Link href="/faq" className="underline hover:text-primary">Size Guide & FAQ</Link></span>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
