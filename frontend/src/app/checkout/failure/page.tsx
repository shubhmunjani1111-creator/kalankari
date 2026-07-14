"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';

function FailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [retryStatus, setRetryStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (!orderId || !token) return;

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok) {
          setOrder(data);
        } else {
          setErrorMsg(data.error || "Order not found.");
        }
      } catch (err) {
        console.error('Fetch failure order details error:', err);
        setErrorMsg("Failed to connect to backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token, isAuthenticated, router]);

  // Dynamically load the Razorpay SDK script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRetryPayment = async () => {
    if (!order || !token) return;
    setRetryStatus('loading');
    setErrorMsg("");

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay SDK. Please check your network.");
        setRetryStatus('error');
        return;
      }

      // 2. Fetch a new Razorpay Order from backend retry-payment endpoint
      const retryRes = await fetch(`${API_BASE_URL}/api/orders/${order._id || order.id}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const retryData = await retryRes.json();

      if (!retryRes.ok) {
        setErrorMsg(retryData.error || "Failed to initialize payment retry.");
        setRetryStatus('error');
        return;
      }

      // 3. Open Razorpay Checkout popup
      const options = {
        key: retryData.key,
        amount: retryData.amount,
        currency: retryData.currency,
        name: "Kalankari",
        description: "Retry Payment - printed kurtis order",
        order_id: retryData.id,
        prefill: {
          name: order.shippingAddress.name,
          email: order.shippingAddress.email,
          contact: order.shippingAddress.phone
        },
        theme: {
          color: "#8B2635"
        },
        handler: async function (response: any) {
          setRetryStatus('loading');
          try {
            // Verify signature
            const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order._id || order.id
              })
            });

            if (verifyRes.ok) {
              router.push(`/checkout/success?id=${order._id || order.id}`);
            } else {
              setRetryStatus('error');
              setErrorMsg("Payment verification failed. Please try again.");
            }
          } catch (err) {
            console.error("Signature verify error:", err);
            setRetryStatus('error');
            setErrorMsg("Payment verification server error.");
          }
        },
        modal: {
          ondismiss: function () {
            setRetryStatus('idle');
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error("Retry payment error:", err);
      setErrorMsg("Failed to re-trigger Razorpay. Please verify connection.");
      setRetryStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <span>Syncing transaction details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center justify-center gap-6 text-left">
      
      {/* Banner */}
      <XCircle size={72} className="text-red-500 animate-pulse mx-auto" />
      <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-white text-center">Payment Failed!</h1>
      <p className="text-xs text-gray-400 text-center max-w-sm">
        We could not complete your online transaction. Don&apos;t worry, your order is saved as pending and you can safely retry the payment now.
      </p>

      {order && (
        <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm w-full text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-3.5">
          <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Order Reference</span> <span className="font-bold text-gray-850 dark:text-white">#{order._id || order.id}</span></p>
          <p className="flex justify-between border-b pb-2"><span className="text-gray-400 font-semibold">Payable Amount</span> <span className="font-bold text-primary dark:text-secondary text-sm">₹{order.payable.toLocaleString()}</span></p>
          <p className="flex justify-between pb-2"><span className="text-gray-400 font-semibold">Recipient</span> <span className="font-medium text-gray-850 dark:text-white">{order.shippingAddress.name}</span></p>
        </div>
      )}

      {errorMsg && (
        <p className="text-red-500 font-semibold bg-red-50/50 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded border border-red-100 dark:border-red-950/40 text-xs w-full text-center">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col gap-4 w-full mt-2">
        <button 
          onClick={handleRetryPayment}
          disabled={retryStatus === 'loading'}
          className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white text-center py-3.5 px-6 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow flex items-center justify-center gap-2 font-buttons uppercase"
        >
          <RefreshCw size={14} className={retryStatus === 'loading' ? 'animate-spin' : ''} />
          {retryStatus === 'loading' ? 'Initializing Secure Gateway...' : 'Retry Online Payment'}
        </button>

        <Link href="/shop" className="border border-gray-300 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-center py-3 px-6 text-xs font-bold uppercase tracking-wider rounded transition-colors">
          Browse Other Styles
        </Link>
      </div>

    </div>
  );
}

export default function Failure() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    }>
      <FailureContent />
    </Suspense>
  );
}
