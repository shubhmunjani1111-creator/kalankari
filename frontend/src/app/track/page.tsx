"use client";

import React, { useState } from 'react';
import { Search, Loader2, ArrowLeft, Package, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    const cleanOrderId = orderId.trim();
    const cleanMobile = mobile.trim();

    if (!cleanOrderId) {
      setError("Please enter a valid Order ID.");
      return;
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit customer mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${cleanOrderId}?mobile=${encodeURIComponent(cleanMobile)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order tracking details not found. Please verify details.");
      }

      setOrder(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while tracking your order.");
    } finally {
      setLoading(false);
    }
  };

  // Maps order status to timeline index
  const getTimelineSteps = (currentStatus: string, paymentStatus: string) => {
    const steps = [
      { label: 'Placed', key: 'Ordered', desc: 'Order details accepted', active: true },
      { label: 'Confirmed', key: 'Confirmed', desc: 'Payment verified & confirmed', active: false },
      { label: 'Packed', key: 'Packed', desc: 'Items packed and checked', active: false },
      { label: 'Shipped', key: 'Shipped', desc: 'Handed over to courier express', active: false },
      { label: 'Out For Delivery', key: 'Out for Delivery', desc: 'Courier out for delivery', active: false },
      { label: 'Delivered', key: 'Delivered', desc: 'Delivered to shipping destination', active: false },
    ];

    const statusPriority: Record<string, number> = {
      'Ordered': 1,
      'Packed': 3,
      'Shipped': 4,
      'Out for Delivery': 5,
      'Delivered': 6
    };

    const currentPriority = statusPriority[currentStatus] || 1;
    const isConfirmed = paymentStatus === 'Completed' || currentPriority >= 3;

    return steps.map(step => {
      let active = false;
      if (step.label === 'Placed') {
        active = true;
      } else if (step.label === 'Confirmed') {
        active = isConfirmed;
      } else {
        const priority = statusPriority[step.key] || 0;
        active = currentPriority >= priority;
      }
      return { ...step, active };
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-left mt-10">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary uppercase tracking-wider transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Shopping
        </Link>
        <h1 className="font-headings font-bold text-3xl text-gray-900 leading-tight">Track Your Shipment</h1>
        <p className="text-sm text-gray-500 mt-2">Enter your Order ID and Mobile number to view live delivery updates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tracking Lookup Form */}
        <div className="lg:col-span-1 bg-white border border-gray-150 p-6 rounded-lg shadow-sm h-fit">
          <form onSubmit={handleTrack} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Order Reference ID</label>
              <input 
                type="text" 
                placeholder="e.g. 6a551e4c73dbf..." 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-gray-250 py-2.5 px-4 text-sm font-medium rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Customer Mobile Number</label>
              <input 
                type="tel" 
                placeholder="10-digit number" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-gray-250 py-2.5 px-4 text-sm font-medium rounded text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary/40"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 font-bold uppercase tracking-wider text-xs rounded transition-colors shadow flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Tracking...
                </>
              ) : (
                <>
                  <Search size={14} /> Track Order
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded leading-relaxed">
              {error}
            </div>
          )}
        </div>

        {/* Tracking Timeline Output */}
        <div className="lg:col-span-2">
          {order ? (
            <div className="bg-white border border-gray-150 p-6 sm:p-8 rounded-lg shadow-sm">
              
              {/* Order Info Bar */}
              <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-4 mb-6 gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Reference</span>
                  <h3 className="font-bold text-gray-800 text-sm mt-0.5">#{order._id || order.id}</h3>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Status</span>
                  <div className="mt-0.5">
                    <span className="bg-[#F6E7D8] text-primary px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Courier info if shipped */}
              {order.trackingNumber && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-6 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Courier Partner</span>
                    <strong className="text-gray-800 text-sm block mt-0.5">{order.courierName || 'Express Courier'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tracking AWB</span>
                    <strong className="text-gray-800 text-sm block mt-0.5">{order.trackingNumber}</strong>
                  </div>
                </div>
              )}

              {/* Progress Timeline Grid */}
              <div className="relative border-l-2 border-gray-150 pl-6 space-y-6 text-left">
                {getTimelineSteps(order.status, order.paymentStatus).map((step, idx) => (
                  <div key={idx} className="relative">
                    
                    {/* Circle Dot Marker */}
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                      step.active 
                        ? 'border-primary bg-primary shadow-[0_0_8px_rgba(139,38,53,0.3)]' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {step.active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </div>

                    {/* Step Title & Details */}
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${
                        step.active ? 'text-primary' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div className="bg-gray-50/50 border border-dashed border-gray-200 h-64 rounded-lg flex flex-col items-center justify-center text-center p-6 select-none">
              <Package size={36} className="text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-500 text-sm">Awaiting Tracking Inquiry</h3>
              <p className="text-xs text-gray-400 max-w-xs mt-1">Please enter your order details to view shipment history details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
