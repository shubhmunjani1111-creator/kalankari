"use client";

import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ReturnExchangePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderId: "",
    requestType: "return", // return, exchange
    reason: "",
    itemsToReturn: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const { name, email, phone, orderId, requestType, reason, itemsToReturn } = formData;

    if (!name.trim() || !email.trim() || !orderId.trim() || !reason.trim() || !itemsToReturn.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const subject = `[${requestType.toUpperCase()} REQUEST] Order #${orderId}`;
      const messageContent = `Request Type: ${requestType.toUpperCase()}
Order ID: ${orderId}
Items for return/exchange:
${itemsToReturn}

Reason:
${reason}`;

      const response = await fetch(`${API_BASE_URL}/api/support/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject,
          message: messageContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setSuccessMsg("Your return/exchange request has been submitted successfully. Our team will email you soon!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        orderId: "",
        requestType: "return",
        reason: "",
        itemsToReturn: ""
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-left mt-10">
      <div className="mb-8">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary uppercase tracking-wider transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Shop
        </Link>
        <h1 className="font-headings font-bold text-3xl text-gray-900 leading-tight">Returns & Exchanges</h1>
        <p className="text-sm text-gray-500 mt-2">Submit a request for items you wish to return or exchange within 7 days of delivery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Guidelines / Policy Column */}
        <div className="lg:col-span-4 bg-gray-50 border border-gray-150 p-6 rounded-lg space-y-5 text-xs text-gray-600">
          <h3 className="font-headings font-bold text-sm text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <RefreshCw size={16} className="text-primary" /> Return Guidelines
          </h3>
          <ul className="list-disc pl-4 space-y-2.5 leading-relaxed">
            <li>Items must be unworn, unwashed, and in their original packaging with tags intact.</li>
            <li>Request must be submitted within <strong>7 days</strong> of order delivery.</li>
            <li>For <strong>exchanges</strong>, specify the required replacement size in the request.</li>
            <li>Refunds for returned items are credited back to your original payment method or bank account within 5-7 business days of warehouse inspection.</li>
          </ul>

          <div className="bg-white p-4 border border-gray-200 rounded flex gap-2 items-start mt-4">
            <ShieldCheck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-gray-800 block">Quality Assured</strong>
              <span className="text-[10px] text-gray-400 block mt-0.5">Every exchange is inspected at our hub in Surat before replacement.</span>
            </div>
          </div>
        </div>

        {/* Request Form Column */}
        <div className="lg:col-span-8 bg-white border border-gray-150 p-6 sm:p-8 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="Siddharth Patel"
                  className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="siddharth@gmail.com"
                  className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Order ID Reference *</label>
                <input 
                  type="text" 
                  name="orderId" 
                  required 
                  value={formData.orderId} 
                  onChange={handleChange}
                  placeholder="e.g. 6a551e4c73dbf..."
                  className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Select Request Type *</label>
              <select 
                name="requestType" 
                value={formData.requestType} 
                onChange={handleChange}
                className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs bg-transparent" 
              >
                <option value="return">Return for Refund</option>
                <option value="exchange">Size / Product Exchange</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Items for Return/Exchange *</label>
              <textarea 
                name="itemsToReturn" 
                required 
                rows={2}
                value={formData.itemsToReturn} 
                onChange={handleChange}
                placeholder="Specify product name, color, and size (e.g., Floral Digital Silk Kurti - Pink - Medium)"
                className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs resize-none" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Reason for Request *</label>
              <textarea 
                name="reason" 
                required 
                rows={4}
                value={formData.reason} 
                onChange={handleChange}
                placeholder="Provide a detailed explanation of why you wish to return/exchange the item."
                className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary text-xs resize-none" 
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded leading-relaxed flex items-start gap-1.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded leading-relaxed flex items-start gap-1.5">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white py-3.5 font-bold uppercase tracking-wider text-xs rounded transition-colors shadow mt-2"
            >
              {loading ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
