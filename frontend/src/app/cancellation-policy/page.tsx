import React from 'react';

export default function CancellationPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-left mt-10 text-gray-700 dark:text-gray-300">
      <h1 className="font-headings font-bold text-3xl text-gray-900 dark:text-white mb-6">Cancellation Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last Updated: July 15, 2026</p>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">1. Order Cancellations by Customer</h2>
          <p>You can request to cancel your order within <strong>6 hours of placing it</strong>, provided the order has not been dispatched. Once our shipping partners pick up the package from our Surat warehouse, the order cannot be cancelled under any circumstances.</p>
          <p className="mt-2.5">To request a cancellation, please email us immediately at <a href="mailto:kalankari8972@gmail.com" className="text-primary hover:underline">kalankari8972@gmail.com</a> or message us on WhatsApp with your Order ID.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">2. Cancellations by Kalankari</h2>
          <p>We reserve the right to cancel any order for reasons such as:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Product being out of stock due to sudden quality control checks.</li>
            <li>Inaccuracies in pricing or product descriptions displayed on the site.</li>
            <li>Incomplete or unverified shipping address/phone number.</li>
            <li>Non-serviceable pincode locations by our courier partners.</li>
          </ul>
          <p className="mt-2.5">If we cancel your order, you will be notified via email, and any payment deducted will be refunded to your source account within 3-5 business days.</p>
        </section>
      </div>
    </div>
  );
}
