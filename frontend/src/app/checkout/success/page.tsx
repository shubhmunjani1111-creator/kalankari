"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Printer, Star, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const phone = searchParams.get('phone') || '';

    const fetchOrderDetails = async () => {
      try {
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const url = token 
          ? `${API_BASE_URL}/api/orders/${orderId}` 
          : `${API_BASE_URL}/api/orders/${orderId}?mobile=${phone}`;

        const response = await fetch(url, {
          method: 'GET',
          headers
        });

        const data = await response.json();

        if (response.ok) {
          setOrder(data);

          // ==========================================
          // META DATASET (PIXEL) PURCHASE TRACKING HERE
          // ==========================================
          if (typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'Purchase', {
              content_ids: data.products?.map((p: any) => p.productId || p.id) || [data._id],
              content_type: 'product',
              value: data.payable, // Exact purchase amount charged (e.g., 2499)
              currency: 'INR'
            });
          }
          // ==========================================

        } else {
          setErrorMsg(data.error || "Order not found.");
        }
      } catch (err) {
        console.error('Fetch success order details error:', err);
        setErrorMsg("Failed to connect to backend server to read order data.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <span>Loading order summary...</span>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
        <h2 className="font-headings text-2xl font-bold text-gray-800">Order Lookup Failed</h2>
        <p className="text-xs text-red-500 font-semibold">{errorMsg || "Order details could not be retrieved."}</p>
        <Link href="/dashboard" className="bg-primary text-white py-2.5 px-6 text-xs font-bold uppercase tracking-wider rounded">
          Go To Dashboard
        </Link>
      </div>
    );
  }

  // Delivery estimation: 5 days from creation
  const deliveryDate = new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center gap-6">
      
      {/* Banner */}
      <div className="flex flex-col items-center gap-2">
        <CheckCircle size={72} className="text-green-600 animate-bounce" />
        <h1 className="font-headings text-3xl font-bold text-gray-900 dark:text-white">Order Placed Successfully!</h1>
        <p className="text-xs text-gray-400 max-w-md">Your payment has been cleared and the digital print order is registered at the Kalankari hub in Surat.</p>
      </div>

      {/* Main card grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Order Details & Summary */}
        <div className="md:col-span-8 bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left flex flex-col justify-between">
          <div className="flex flex-col gap-3.5 text-xs text-gray-600 dark:text-gray-300">
            <h3 className="font-headings text-lg font-bold text-gray-950 dark:text-white border-b pb-2.5 mb-2 flex items-center justify-between">
              Order Receipt
              <a 
                href={token ? `${API_BASE_URL}/api/orders/${order._id}/invoice?token=${token}` : `${API_BASE_URL}/api/orders/${order._id}/invoice?mobile=${order.shippingAddress.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  // Open invoice endpoint passing auth header or mobile verification parameter in a separate tab
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const headers: any = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const invoiceUrl = token 
                      ? `${API_BASE_URL}/api/orders/${order._id}/invoice` 
                      : `${API_BASE_URL}/api/orders/${order._id}/invoice?mobile=${order.shippingAddress.phone}`;

                    fetch(invoiceUrl, { headers })
                    .then(res => res.text())
                    .then(html => {
                      printWindow.document.write(html);
                      printWindow.document.close();
                    });
                  }
                }}
                className="text-[10px] uppercase font-bold text-secondary hover:text-secondary-dark flex items-center gap-1 cursor-pointer border border-secondary/20 px-2.5 py-1 rounded"
              >
                <Printer size={12} /> Print Invoice
              </a>
            </h3>

            <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Order Number</span> <span className="font-bold text-gray-800 dark:text-white">#{order.orderNumber || order._id}</span></p>
            <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Order Date</span> <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span></p>
            <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Payment Mode</span> <span className="uppercase">{order.paymentMethod}</span></p>
            <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Payment Status</span> <span className="font-bold text-green-600 dark:text-green-400">{order.paymentStatus}</span></p>
            <p className="flex justify-between border-t pt-2 border-gray-100 dark:border-zinc-900 font-bold text-gray-850 dark:text-white text-sm"><span className="text-gray-400">Total Billed</span> <span className="text-primary dark:text-secondary text-base">₹{order.payable.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Loyalty & Delivery details */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Delivery Box */}
          <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left flex flex-col gap-2 flex-grow">
            <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Truck size={12} className="text-secondary" /> Shipping Estimate</h3>
            <p className="text-xs font-semibold text-gray-800 dark:text-white leading-relaxed mt-1">Expected delivery on or before:</p>
            <p className="text-sm font-bold text-primary dark:text-secondary leading-tight mt-1">{deliveryDateStr}</p>
            <div className="bg-gray-50/50 dark:bg-zinc-900/30 p-2.5 rounded border border-gray-100 dark:border-zinc-950 mt-auto text-[10px] text-gray-400 leading-relaxed flex items-start gap-1.5">
              <MapPin size={12} className="text-secondary flex-shrink-0 mt-0.5" />
              <span>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pin}</span>
            </div>
          </div>


        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
        <Link href="/dashboard" className="bg-primary hover:bg-primary-hover text-white text-center py-3.5 px-6 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex-grow flex items-center justify-center gap-2">
          View My Orders <ArrowRight size={14} />
        </Link>
        <Link href="/shop" className="border border-gray-300 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-center py-3.5 px-6 text-xs font-bold uppercase tracking-wider rounded transition-colors flex-grow">
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
