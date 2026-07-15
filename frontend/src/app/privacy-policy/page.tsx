import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-left mt-10 text-gray-700 dark:text-gray-300">
      <h1 className="font-headings font-bold text-3xl text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last Updated: July 15, 2026</p>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">1. Information We Collect</h2>
          <p>We collect personal information that you provide directly to us when placing an order, registering an account, subscribing to our newsletter, or contacting customer support. This information may include your name, shipping address, billing address, phone number, email address, and payment information.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">2. How We Use Your Information</h2>
          <p>We use the information we collect to process orders, manage accounts, provide customer service, ship products, process payments, prevent fraud, and send promotional communications (which you can opt-out of at any time).</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">3. Data Sharing and Security</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We share your data with trusted partners (such as courier services and payment processors like Razorpay) solely to complete transactions and shipments. We implement robust security measures to protect your sensitive personal data during transmission and storage.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">4. Cookies Policy</h2>
          <p>We use cookies to analyze web traffic, remember items in your shopping cart, and improve your overall browsing experience. You can choose to disable cookies in your browser settings, though some website features may stop functioning correctly.</p>
        </section>

        <section>
          <h2 className="font-headings font-bold text-lg text-gray-800 dark:text-white mb-2.5">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact our support desk at <a href="mailto:support@kalankari.com" className="text-primary hover:underline">support@kalankari.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
