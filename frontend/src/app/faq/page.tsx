"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqData = [
    {
      category: "Sizing & Fit Guide",
      questions: [
        {
          q: "What is your standard size chart?",
          a: "Our kurtis follow standard Indian sizing (Small to XXL). S is suited for bust size 36 inches, M for 38 inches, L for 40 inches, XL for 42 inches, and XXL for 44 inches. We recommend checking the Size Guide button on product details for exact fits."
        },
        {
          q: "Do you offer customized sizing adjustments?",
          a: "For special sizing adjustments, you can order the nearest size and connect with us on WhatsApp (8866448972) immediately with your Order ID to request minor modifications in length or sleeve fitting before shipment."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      questions: [
        {
          q: "How long does shipping take?",
          a: "Standard shipping takes 4 to 7 business days depending on your location. Express shipping option is processed instantly and delivers inside 2 to 3 business days across pan-India pin codes."
        },
        {
          q: "How can I track my shipment?",
          a: "Once your order is processed from our Surat hub, you will receive an email containing the tracking ID and carrier link (BlueDart, DTDC, or other courier partners) to monitor shipment updates live."
        }
      ]
    },
    {
      category: "Exchanges & Policies",
      questions: [
        {
          q: "Do you support returns or refunds?",
          a: "We operate on an Exchange Only policy. We do not provide refunds or returns unless the product arrived damaged or defective and a replacement is unavailable. You can exchange your kurti for a different size or alternative print design within 7 days of delivery."
        },
        {
          q: "How do I request a size or design exchange?",
          a: "To initiate an exchange, please visit our Exchange Desk page, enter your Order ID, and specify the desired replacement details. We will arrange a free reverse pickup from your shipping address within 24-48 hours."
        }
      ]
    },
    {
      category: "Fabric Care & Prints Quality",
      questions: [
        {
          q: "Will the digital print color bleed or fade?",
          a: "No. We utilize industrial-grade high-definition digital printing technologies that chemically bind the pigments with the silk/cotton fibers. The colors will stay vibrant even after multiple washes."
        },
        {
          q: "How should I wash and care for my kurtis?",
          a: "For Silk and Chanderi blends, we strongly recommend dry cleaning to preserve the fabric sheen. Cotton and linen blends can be hand-washed separately in cold water with a mild detergent. Always iron on the reverse side."
        }
      ]
    }
  ];

  // Store open state for each question: "categoryIndex-questionIndex"
  const [openItem, setOpenItem] = useState<string | null>("0-0");

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full min-h-screen text-left">
      <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2.5">
        <HelpCircle className="text-secondary" /> FAQ & Help
      </h1>
      <p className="text-xs text-gray-400 mb-8 border-b pb-4 border-gray-100 dark:border-zinc-900">
        Find answers to frequently asked questions about Kalankari sizing, deliveries, returns, and premium prints care.
      </p>

      <div className="flex flex-col gap-8">
        {faqData.map((cat, catIdx) => (
          <div key={catIdx} className="flex flex-col gap-3">
            <h3 className="font-headings text-lg font-bold text-primary dark:text-secondary border-b pb-1.5 border-gray-50 dark:border-zinc-900 text-left">
              {cat.category}
            </h3>
            
            <div className="flex flex-col gap-2">
              {cat.questions.map((item, qIdx) => {
                const itemId = `${catIdx}-${qIdx}`;
                const isOpen = openItem === itemId;

                return (
                  <div 
                    key={qIdx} 
                    className="bg-white dark:bg-[#121111] border border-gray-150 dark:border-zinc-900 rounded-lg overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full py-4 px-5 text-left flex justify-between items-center text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors gap-4"
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-gray-500 dark:text-gray-450 border-t border-gray-50 dark:border-zinc-950 leading-relaxed font-normal animate-fade-in text-left">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
