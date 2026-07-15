"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ShoppingBag, ShieldCheck, ArrowLeft, Send, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { API_BASE_URL } from '@/config';

export default function Checkout() {
  const { user, token, isAuthenticated } = useAuth();
  const { cart, grandTotal, subtotal, tax, shipping, discount, clearCart } = useCart();
  const router = useRouter();

  // Address and payment states
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Card'>('COD');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

  // Placed Order feedback states
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Sync user details
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone
      }));
    }
  }, [user]);

  // If cart is empty, do not allow checkout
  if (cart.length === 0 && status !== 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center flex flex-col items-center justify-center gap-4">
        <ShoppingBag size={64} className="text-gray-300 dark:text-zinc-800 animate-bounce" />
        <h1 className="font-headings text-2xl font-bold text-gray-800 dark:text-gray-200">Checkout is Empty</h1>
        <p className="text-xs text-gray-500 max-w-sm">You must add printed kurtis to your shopping bag before checking out.</p>
        <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white px-8 py-3 text-xs font-bold tracking-widest uppercase transition-colors rounded shadow mt-2">
          Browse Collections
        </Link>
      </div>
    );
  }

  // Allow both guests and logged-in customers to view the form.
  // Emails are collected for all orders to send receipt notifications.

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const currentSubtotal = Math.max(0, subtotal - discount);
  const currentPayable = currentSubtotal + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg("");

    // Validate email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(shippingAddress.email).toLowerCase())) {
      setErrorMsg("Please enter a valid email address.");
      setStatus('error');
      return;
    }

    const orderPayload = {
      items: cart.map(item => ({
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        selectedSize: item.selectedSize
      })),
      subtotal,
      discount,
      pointsRedeemed: 0,
      tax: 0,
      shipping,
      payable: currentPayable,
      paymentMethod: paymentMethod === 'COD' ? 'cod' : 'razorpay',
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        street: shippingAddress.addressLine,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pin: shippingAddress.pincode
      }
    };

    try {
      // 1. Post pending order to backend API
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await response.json();

      if (!response.ok) {
        setErrorMsg(orderData.error || "Order submission was rejected by the server.");
        setStatus('error');
        return;
      }

      // If COD, complete order immediately
      if (paymentMethod === 'COD') {
        setPlacedOrder(orderData);
        setStatus('success');
        clearCart();
        router.push(`/checkout/success?id=${orderData._id || orderData.id}&phone=${shippingAddress.phone}`);
        return;
      }

      // 2. Handle Online Payment (Razorpay)
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay SDK. Please check your internet connection.");
        setStatus('error');
        return;
      }

      // Call API to create Razorpay Order
      const rzpOrderResponse = await fetch(`${API_BASE_URL}/api/payments/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: currentPayable,
          receipt: `receipt_order_${orderData._id || orderData.id}`
        })
      });

      const rzpOrderData = await rzpOrderResponse.json();

      if (!rzpOrderResponse.ok) {
        setErrorMsg(rzpOrderData.error || "Failed to initialize online transaction.");
        setStatus('error');
        return;
      }

      // Launch Razorpay overlay popup
      const options = {
        key: rzpOrderData.key,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency,
        name: "Kalankari",
        description: "Premium Digital Printed Kurtis",
        order_id: rzpOrderData.id,
        prefill: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          contact: shippingAddress.phone
        },
        theme: {
          color: "#8B2635" // Royal Maroon theme color
        },
        handler: async function (response: any) {
          setStatus('submitting');
          try {
            // Verify payment signature
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
                order_id: orderData._id || orderData.id
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              clearCart();
              router.push(`/checkout/success?id=${orderData._id || orderData.id}&phone=${shippingAddress.phone}`);
            } else {
              router.push(`/checkout/failure?id=${orderData._id || orderData.id}`);
            }
          } catch (err) {
            console.error("Signature verify network error:", err);
            router.push(`/checkout/failure?id=${orderData._id || orderData.id}`);
          }
        },
        modal: {
          ondismiss: function () {
            // Redirect to failure page if popup closed
            router.push(`/checkout/failure?id=${orderData._id || orderData.id}`);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Order submission error:', error);
      setErrorMsg("Network error. Please verify your connection to the database/backend and try again.");
      setStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-screen text-left">
      <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider text-gray-400">
        <Link href="/cart" className="hover:text-primary transition-colors flex items-center gap-1"><ArrowLeft size={12} /> Bag</Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-white">Secure Checkout</span>
      </div>

      <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-4 border-gray-100 dark:border-zinc-900">
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Shipping section */}
          <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex flex-col gap-4 text-xs text-gray-700 dark:text-gray-300">
            <h3 className="font-headings text-lg font-bold text-gray-900 dark:text-white mb-2">Shipping Information</h3>
            
            {!isAuthenticated && (
              <div className="bg-[#FFF8F2] border border-[#C49A6C] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left mb-2">
                <span className="text-gray-600">You are checking out as a <strong>Guest</strong>. Register an account to earn 10% loyalty points on this order!</span>
                <Link href="/auth?redirect=/checkout" className="text-primary font-bold hover:underline shrink-0">Log In / Sign Up &rarr;</Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Recipient Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={shippingAddress.name} 
                  onChange={handleInputChange}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Contact Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required 
                  value={shippingAddress.phone} 
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={shippingAddress.email} 
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Street Address</label>
              <input 
                type="text" 
                name="addressLine" 
                required 
                value={shippingAddress.addressLine} 
                onChange={handleInputChange}
                placeholder="House no., street name, area, landmark"
                className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  name="city" 
                  required 
                  value={shippingAddress.city} 
                  onChange={handleInputChange}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">State</label>
                <input 
                  type="text" 
                  name="state" 
                  required 
                  value={shippingAddress.state} 
                  onChange={handleInputChange}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Pincode</label>
                <input 
                  type="text" 
                  name="pincode" 
                  required 
                  value={shippingAddress.pincode} 
                  onChange={handleInputChange}
                  placeholder="6 digits"
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>
            </div>
          </div>



          {/* Payment section */}
          <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex flex-col gap-4 text-xs text-gray-700 dark:text-gray-300">
            <h3 className="font-headings text-lg font-bold text-gray-900 dark:text-white mb-2">Payment Method</h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer flex-1 transition-all ${paymentMethod === 'COD' ? 'border-primary ring-1 ring-primary bg-primary/[0.02]' : 'border-gray-250 dark:border-zinc-800'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="w-4 h-4 text-primary accent-primary" 
                />
                <div className="text-left">
                  <span className="font-bold block text-sm">Cash on Delivery (COD)</span>
                  <span className="text-[10px] text-gray-400">Pay inside India when order arrives.</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer flex-1 transition-all ${paymentMethod === 'Card' ? 'border-primary ring-1 ring-primary bg-primary/[0.02]' : 'border-gray-250 dark:border-zinc-800'}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  checked={paymentMethod === 'Card'}
                  onChange={() => setPaymentMethod('Card')}
                  className="w-4 h-4 text-primary accent-primary" 
                />
                <div className="text-left text-xs">
                  <span className="font-bold block text-sm flex items-center gap-1.5"><CreditCard size={14} /> Pay Online (Razorpay)</span>
                  <span className="text-[10px] text-gray-400">Secure transaction via Cards, UPI, Netbanking.</span>
                </div>
              </label>
            </div>
          </div>

          {status === 'error' && (
            <p className="text-red-500 font-semibold bg-red-50/50 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded border border-red-100 dark:border-red-950/40 text-xs">
              {errorMsg}
            </p>
          )}

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white text-center py-4 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow mt-2 flex items-center justify-center gap-2 uppercase font-buttons"
          >
            <Send size={12} />
            {status === 'submitting' ? 'Processing Order...' : `Pay & Complete Order (₹${currentPayable.toLocaleString()})`}
          </button>
        </form>

        {/* Right Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
            <h3 className="font-headings text-lg text-gray-800 dark:text-white border-b pb-3 mb-4">
              My Order ({cart.length})
            </h3>
            
            {/* List */}
            <div className="flex flex-col gap-4 max-h-64 overflow-y-auto mb-4 border-b pb-4">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3 text-xs items-center">
                  <img src={item.image} alt={item.name} className="w-10 h-14 object-cover bg-gray-50 rounded flex-shrink-0" />
                  <div className="flex-grow">
                    <h4 className="font-semibold text-xs leading-snug line-clamp-1">{item.name}</h4>
                    <span className="text-[10px] text-gray-400">Qty: {item.quantity} | Size: {item.selectedSize}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString()}</span>
              </div>
              


              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 dark:border-zinc-900 pt-3 font-bold text-gray-800 dark:text-white text-sm">
                <span>Total Amount:</span>
                <span className="text-primary dark:text-secondary text-base">₹{currentPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
