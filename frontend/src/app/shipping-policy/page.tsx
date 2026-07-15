import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-left mt-10 text-gray-700 dark:text-gray-300">
      <h1 className="font-headings font-bold text-3xl text-gray-900 dark:text-white mb-6">Shipping Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last Updated: July 15, 2026</p>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">1. Shipping Charges</h2>
          <p>We offer <strong>Free Shipping</strong> throughout India on all prepaid and Cash on Delivery (COD) orders above ₹1,199. For orders below ₹1,199, a standard shipping fee of ₹99 is applicable at checkout.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">2. Processing & Delivery Timeline</h2>
          <p>All orders are processed and shipped from our Surat hub within 1-2 business days. Delivery timelines are as follows:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Metro Cities:</strong> 3-5 business days.</li>
            <li><strong>Non-Metro Cities & Tier 2/3 Towns:</strong> 5-7 business days.</li>
            <li><strong>Rest of India:</strong> 7-10 business days.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">3. Shipping Partners & Tracking</h2>
          <p>We partner with reliable courier services (such as Delhivery, Blue Dart, ExpressBees) to ship your orders. Once your order has been dispatched, you will receive a tracking link via email to monitor your package on our <a href="/track" className="text-primary hover:underline font-semibold">Track Shipment</a> page.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">4. Delivery Issues</h2>
          <p>If you encounter delivery issues or a package is marked delivered but you have not received it, please contact our support desk immediately at <a href="mailto:support@kalankari.com" className="text-primary hover:underline">support@kalankari.com</a> or phone <strong>8866448972</strong>.</p>
        </section>
      </div>
    </div>
  );
}
