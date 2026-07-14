"use client";

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '@/config';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Post message to backend support endpoint
      const response = await fetch(`${API_BASE_URL}/api/support/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Contact submit error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="w-full min-h-screen bg-brandBg-light dark:bg-brandBg-dark text-left">
      {/* Hero Header */}
      <section className="relative py-24 bg-[#F6E7D8]/30 dark:bg-zinc-950/40 overflow-hidden border-b border-gray-150 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col gap-4 relative z-10">
          <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs sm:text-sm">
            Support Desk
          </span>
          <h1 className="font-headings text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Connect With <span className="text-primary dark:text-secondary">Kalankari</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mt-2">
            Have queries regarding your order, customized sizing, or shipping updates? Our customer care desk operates from Surat to assist you.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left: Contact Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121111] p-8 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm">
          <h2 className="font-headings text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send Us a Message</h2>
          
          {status === 'success' ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-950/40 text-green-700 dark:text-green-400 p-6 rounded-lg text-center flex flex-col items-center gap-3">
              <MessageSquare size={48} />
              <h3 className="font-bold text-base">Message Sent Successfully!</h3>
              <p className="text-xs max-w-sm">Thank you for contacting us. A customer support representative will review your query and reply to your email address within 24 hours.</p>
              <button 
                onClick={() => setStatus('idle')} 
                className="mt-4 bg-primary text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded hover:bg-primary-hover transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs text-gray-700 dark:text-gray-300">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full py-2.5 px-4 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full py-2.5 px-4 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Subject</label>
                <input 
                  type="text" 
                  id="subject"
                  name="subject" 
                  required 
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Order ID / Sizing Query / General Feedback"
                  className="w-full py-2.5 px-4 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Message</label>
                <textarea 
                  id="message"
                  name="message" 
                  rows={6}
                  required 
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full py-2.5 px-4 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs resize-none" 
                />
              </div>

              {status === 'error' && (
                <p className="text-red-500 font-semibold bg-red-50/50 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded border border-red-100 dark:border-red-950/40">
                  Something went wrong. Please check your internet connection or try again later.
                </p>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white py-3.5 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow flex items-center justify-center gap-2 uppercase"
              >
                <Send size={12} />
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Right: Contact details */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div>
            <h2 className="font-headings text-2xl font-bold mb-2 text-gray-900 dark:text-white">Our Headquarters</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Feel free to connect directly through our official channels. WhatsApp is best for instant resolution of sizing concerns.</p>
          </div>

          <div className="flex flex-col gap-6 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-[#F6E7D8]/60 text-primary dark:bg-zinc-900 dark:text-secondary rounded-full flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Address Hub</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Kedar Business Center</span>
                <span>Dabholi Road, Katargam, Surat - 395004</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-[#F6E7D8]/60 text-primary dark:bg-zinc-900 dark:text-secondary rounded-full flex-shrink-0">
                <Phone size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Phone Support</span>
                <a href="tel:8866448972" className="font-semibold text-gray-800 dark:text-gray-200 hover:underline">8866448972</a>
                <span className="text-[10px] text-gray-400 font-semibold mt-1">
                  WhatsApp:{" "}
                  <a 
                    href="https://wa.me/918866448972?text=Hi%20Kalankari%20team,%2520I%2520have%2520a%2520query!" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    Click to chat directly
                  </a>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-[#F6E7D8]/60 text-primary dark:bg-zinc-900 dark:text-secondary rounded-full flex-shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Email Inquiry</span>
                <a href="mailto:kalankari8972@gmail.com" className="font-semibold text-gray-800 dark:text-gray-200 hover:underline">kalankari8972@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="border-t border-gray-150 dark:border-zinc-900 pt-6">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2">Operational Hours</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monday – Saturday: 10:00 AM – 7:00 PM IST</p>
            <p className="text-xs text-gray-400 mt-1">Closed on Sundays and National Holidays.</p>
          </div>
        </div>

      </section>
    </div>
  );
}
