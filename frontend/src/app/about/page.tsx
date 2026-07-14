"use client";

import React from 'react';
import { Award, Compass, Heart } from 'lucide-react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="w-full min-h-screen bg-brandBg-light dark:bg-brandBg-dark text-left">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#F6E7D8]/30 dark:bg-zinc-950/40 overflow-hidden border-b border-gray-150 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col gap-4 relative z-10">
          <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs sm:text-sm">
            Our Story
          </span>
          <h1 className="font-headings text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Wear Art. Wear <span className="text-primary dark:text-secondary">Kalankari</span>.
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mt-2">
            Born in the textile capital of Surat, Kalankari represents a beautiful marriage between classical Indian motifs and modern digital print precision.
          </p>
        </div>
      </section>

      {/* Main content grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <h2 className="font-headings text-3xl font-bold text-gray-900 dark:text-white border-l-4 border-secondary pl-3">
            Celebrating Indian Heritage
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
            For generations, Indian garments have served as canvases of cultural storytelling. At Kalankari, we honor this legacy by reviving traditional motifs—from the majestic royal peacock of ancient courts to ornate floral vine works—and rendering them with absolute digital high-definition clarity.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
            Our design house works directly with master weavers and contemporary illustrators to ensure every piece is a wearable masterpiece. By utilizing premium Chanderi silks, pure cotton lurex, and georgette blends, we construct kurtis that are as breathable and comfortable as they are visually opulent.
          </p>
          
          <div className="flex gap-4 mt-4">
            <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 text-xs font-bold tracking-widest uppercase transition-colors rounded shadow">
              Explore Collections
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 relative flex justify-center">
          <div className="aspect-[4/5] w-full max-w-[400px] rounded-lg overflow-hidden border border-gray-150 dark:border-zinc-800 shadow-xl bg-gray-50 dark:bg-zinc-900">
            <img 
              src="/products/file_00000000ae0c7208bef8667a6749fed3.png" 
              alt="Kalankari Artisanal Printing Showcase" 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-secondary -z-10"></div>
          <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-2 border-l-2 border-secondary -z-10"></div>
        </div>
      </section>

      {/* Values section */}
      <section className="bg-[#F6E7D8]/10 dark:bg-[#121111]/30 py-20 border-t border-b border-gray-100 dark:border-zinc-900 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h2 className="font-headings text-3xl font-bold mb-16 text-gray-900 dark:text-white">Our Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="p-4 bg-primary/5 text-primary dark:bg-zinc-800 dark:text-secondary rounded-full">
                <Award size={28} />
              </div>
              <h3 className="font-headings text-lg font-bold">Uncompromising Quality</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                From selecting raw silk fibers to finalizing pixel-perfect color balances, we inspect every kurti to meet high luxury standards.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="p-4 bg-primary/5 text-primary dark:bg-zinc-800 dark:text-secondary rounded-full">
                <Compass size={28} />
              </div>
              <h3 className="font-headings text-lg font-bold">Artistic Authenticity</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                We draw direct inspiration from traditional Indian art forms like Kalamkari, Bandhani, and Mughal court silhouettes.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
              <div className="p-4 bg-primary/5 text-primary dark:bg-zinc-800 dark:text-secondary rounded-full">
                <Heart size={28} />
              </div>
              <h3 className="font-headings text-lg font-bold">Surat Craftsmanship</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Operating directly from Katargam, Surat—India's textile capital—allows us to collaborate with veteran dye-masters and fabric craftsmen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
