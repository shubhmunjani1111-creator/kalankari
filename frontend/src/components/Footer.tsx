"use client";

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A1A1A] text-[#F6E7D8] pt-16 pb-20 lg:pb-8 border-t border-gray-900 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 border-b border-gray-800 pb-12 mb-8 text-left">
        
        {/* Brand info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="Kalankari Logo" 
              className="h-12 w-12 rounded-full ring-2 ring-secondary bg-white"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fallback = document.getElementById('logo-fallback-footer');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <h3 id="logo-fallback-footer" className="font-headings font-bold text-2xl tracking-wider text-secondary">
              Kalankari
            </h3>
          </div>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            &quot;Wear Art. Wear Kalankari.&quot; celebrating authentic Indian artistry through premium digital printed kurtis crafted for modern women.
          </p>
          <div className="flex items-center gap-4 text-gray-400 mt-2">
            <a 
              href="https://instagram.com/kalankari.06" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors" 
              title="Instagram @kalankari.06"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://wa.me/918866448972?text=Hi%20Kalankari%20team,%20I%2520have%2520a%2520query!" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-green-500 transition-colors text-xs flex items-center gap-1 font-semibold uppercase tracking-wider" 
              title="WhatsApp Support"
            >
              WhatsApp Support
            </a>
          </div>
        </div>

        {/* Shop links */}
        <div className="flex flex-col gap-4">
          <h4 className="font-headings font-bold text-lg text-white border-l-2 border-secondary pl-2 uppercase tracking-wide">
            Shop Collection
          </h4>
          <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
            <Link href="/shop?category=Floral%20Collection" className="hover:text-secondary transition-colors">
              Floral Collection
            </Link>
            <Link href="/shop?category=Festive%20Collection" className="hover:text-secondary transition-colors">
              Festive Collection
            </Link>
            <Link href="/shop?category=Premium%20Collection" className="hover:text-secondary transition-colors">
              Premium Collection
            </Link>
          </nav>
        </div>

        {/* Helpful links */}
        <div className="flex flex-col gap-4">
          <h4 className="font-headings font-bold text-lg text-white border-l-2 border-secondary pl-2 uppercase tracking-wide">
            Customer Desk
          </h4>
          <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
            <Link href="/track" className="hover:text-secondary transition-colors">
              Track Shipment
            </Link>
            <Link href="/exchange" className="hover:text-secondary transition-colors">
              Exchange Desk
            </Link>
            <Link href="/contact" className="hover:text-secondary transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>

        {/* Legal Policies */}
        <div className="flex flex-col gap-4">
          <h4 className="font-headings font-bold text-lg text-white border-l-2 border-secondary pl-2 uppercase tracking-wide">
            Legal Desk
          </h4>
          <nav className="flex flex-col gap-2.5 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-secondary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-secondary transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refund-policy" className="hover:text-secondary transition-colors">
              Refund Policy
            </Link>
            <Link href="/shipping-policy" className="hover:text-secondary transition-colors">
              Shipping Policy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-secondary transition-colors">
              Cancellation Policy
            </Link>
          </nav>
        </div>

        {/* Surat HQ details */}
        <div className="flex flex-col gap-4">
          <h4 className="font-headings font-bold text-lg text-white border-l-2 border-secondary pl-2 uppercase tracking-wide">
            Kalankari Hub
          </h4>
          <div className="flex flex-col gap-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-secondary mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">Kedar Business Center, Dabholi Road, Katargam, Surat - 395004</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-secondary flex-shrink-0" />
              <a href="tel:8866448972" className="hover:underline">8866448972</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-secondary flex-shrink-0" />
              <a href="mailto:support@kalankari.com" className="hover:underline">support@kalankari.com</a>
            </div>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
        <p>&copy; 2026 Kalankari Kurtis. Made with Art in India. All rights reserved.</p>
      </div>
    </footer>
  );
};
