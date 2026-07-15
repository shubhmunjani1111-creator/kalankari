import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-left mt-10 text-gray-700 dark:text-gray-300">
      <h1 className="font-headings font-bold text-3xl text-gray-900 dark:text-white mb-6">Refund & Exchange Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last Updated: July 15, 2026</p>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">1. Exchange Only Policy</h2>
          <p>We are dedicated to providing you with premium digital print kurtis. To maintain high-quality operations, we enforce a strict <strong>Exchange Only</strong> policy. We do not offer refunds or order cancellations once an order has been shipped, unless explicitly outlined below.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">2. Sizing and Product Exchanges</h2>
          <p>If your kurti does not fit properly or you wish to exchange it for another print, you may request an exchange within <strong>7 days of delivery</strong>. The item must be unused, unwashed, unaltered, and returned in its original packaging with all brand tags intact.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">3. Damaged or Defective Items</h2>
          <p>In the highly unlikely event that your order arrives damaged, defective, or incorrect, we will gladly arrange a free replacement. If a replacement is unavailable, we will process a full refund to your original payment method within 5-7 business days of inspecting the item at our warehouse.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">4. How to Request an Exchange</h2>
          <p>To initiate a product or size exchange request, please navigate to our <a href="/exchange" className="text-primary hover:underline font-semibold">Exchange Desk</a> page and submit your order details.</p>
        </section>
      </div>
    </div>
  );
}
