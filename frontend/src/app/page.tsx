"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Award, RefreshCw, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import Link from 'next/link';
import { PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { API_BASE_URL } from '@/config';

const getNormalizedCollection = (product: any): string => {
  const cat = (product.category || "").toLowerCase().trim();
  const coll = (product.collectionType || "").toLowerCase().trim();
  
  if (cat.includes("floral") || coll.includes("floral")) {
    return "Floral Collection";
  }
  if (cat.includes("festive") || coll.includes("festive") || cat.includes("festival") || coll.includes("festival")) {
    return "Festive Collection";
  }
  if (cat.includes("premium") || coll.includes("premium")) {
    return "Premium Collection";
  }
  return product.category || "Other";
};

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const testimonials = [
    { name: "Priyanka Sharma", loc: "New Delhi", review: "I wore the Mughal Motif kurti to an office festive lunch, and received so many compliments! The Chanderi silk fabric feels luxurious and stays fresh all day.", rating: 5 },
    { name: "Ananya Rao", loc: "Bangalore", review: "The prints are incredibly vivid, exactly like the photos! Cotton quality is exceptional, very breathable. It didn't fade at all after 3 machine washes.", rating: 5 }
  ];

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  // Dynamically load hero slides from database featured products
  const featuredDbProducts = dbProducts.filter(p => p.isFeatured);
  const heroSlides = featuredDbProducts.length > 0
    ? featuredDbProducts.slice(0, 5).map(p => ({
        id: p._id,
        name: p.name,
        tag: p.collectionType || 'Premium',
        img: p.images && p.images[0] ? p.images[0] : "/logo.jpg"
      }))
    : [
        {
          id: "65ca1d20f91a034dd2674001",
          name: "Mayur Peacock Kurti",
          tag: "Festive Silk",
          img: "/products/file_00000000046c720795da034dd2674be1.png"
        },
        {
          id: "65ca1d20f91a034dd2674002",
          name: "Aanya Mughal Motif Kurti",
          tag: "Mughal Motif",
          img: "/products/file_0000000013f07206809b90484b6de3a1 (1).png"
        },
        {
          id: "65ca1d20f91a034dd2674005",
          name: "Meera Silk Border Kurti",
          tag: "Premium Silk",
          img: "/products/file_0000000092fc7206a8df183f957bfac9.png"
        }
      ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();
        if (res.ok) setDbProducts(data);
      } catch (err) {
        console.error("Fetch home products failed:", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleNextHeroSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevHeroSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const uniqueCategories = [
    "Floral Collection",
    "Festive Collection",
    "Premium Collection"
  ];

  const featuredProducts = dbProducts.filter(p => p.isFeaturedProduct);
  const bestSellers = dbProducts.filter(p => p.isBestSeller);
  const newArrivals = dbProducts.filter(p => p.isNewArrival);
  const instagramProducts = dbProducts.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen w-full overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-[#F6E7D8]/30 dark:bg-[#0A0A0A] pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A373]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B2635]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 py-12">
          {/* Left Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 flex flex-col gap-6 text-left"
          >
            <span className="text-primary dark:text-secondary uppercase tracking-[0.25em] font-semibold text-xs sm:text-sm">
              Wear Art. Wear Kalankari.
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-headings text-gray-900 dark:text-white">
              Where Art Meets <span className="text-primary dark:text-secondary">Fashion</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              Premium digital printed kurtis designed for every modern woman. Experience royal Indian motifs blended with luxurious modern silhouettes.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors rounded shadow-md">
                Shop Now <ArrowRight size={14} />
              </Link>
              <Link href="/about" className="border border-gray-900 dark:border-white px-8 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 rounded">
                Our Heritage
              </Link>
            </div>
          </motion.div>

          {/* Right Slideshow Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-6 relative flex justify-center w-full"
          >
            <div className="w-full max-w-[400px] aspect-[4/5] relative border-[10px] border-white dark:border-zinc-900 shadow-2xl overflow-hidden group rounded-lg">
              
              <div className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img 
                      src={heroSlides[activeHeroSlide].img} 
                      alt={heroSlides[activeHeroSlide].name} 
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 text-white text-left z-20">
                      <span className="text-[9px] uppercase tracking-widest text-secondary font-bold bg-black/45 px-2.5 py-1 mb-2 inline-block rounded">
                        {heroSlides[activeHeroSlide].tag}
                      </span>
                      <h3 className="font-headings text-lg sm:text-xl font-bold">{heroSlides[activeHeroSlide].name}</h3>
                      <Link href={`/shop/${heroSlides[activeHeroSlide].id}`} className="text-xs text-secondary hover:text-white uppercase mt-1.5 inline-flex items-center gap-1 font-bold transition-colors">
                        Shop Now <ArrowRight size={10} />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button 
                onClick={handlePrevHeroSlide} 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 dark:bg-black/40 hover:bg-primary text-white flex items-center justify-center transition-colors z-30" 
                title="Previous"
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextHeroSlide} 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 dark:bg-black/40 hover:bg-primary text-white flex items-center justify-center transition-colors z-30" 
                title="Next"
                aria-label="Next slide"
              >
                <ChevronRight size={16} />
              </button>

              <div className="absolute bottom-4 right-6 flex gap-2 z-30">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-350 ${idx === activeHeroSlide ? 'bg-secondary w-5' : 'bg-white/50'}`}
                    title={`Slide ${idx + 1}`}
                    aria-label={`Slide ${idx + 1}`}
                  ></button>
                ))}
              </div>
            </div>
            
            <div className="absolute -top-3 -left-3 w-16 h-16 border-t border-l border-secondary -z-10 rounded-tl"></div>
            <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b border-r border-secondary -z-10 rounded-br"></div>
          </motion.div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Curated Styles</span>
          <h2 className="text-3xl sm:text-4xl font-headings font-bold">Featured Categories</h2>
          <div className="w-16 h-0.5 bg-primary dark:bg-secondary mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {uniqueCategories.map((catName) => {
            const catProducts = dbProducts.filter(p => getNormalizedCollection(p) === catName);
            const count = catProducts.length;

            const defaultImages: Record<string, string> = {
              "Floral Collection": "/products/file_00000000405c720cbb142ab6916ffcbe.png",
              "Festive Collection": "/products/file_00000000046c720795da034dd2674be1.png",
              "Premium Collection": "/products/file_0000000013f07206809b90484b6de3a1 (1).png"
            };

            const coverImage = catProducts.length > 0 && catProducts[0].images && catProducts[0].images[0]
              ? catProducts[0].images[0]
              : (defaultImages[catName] || "/logo.jpg");

            return (
              <Link 
                key={catName} 
                href={`/shop?category=${encodeURIComponent(catName)}`} 
                className="group relative block aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-zinc-900 shadow-sm rounded-lg"
              >
                <img 
                  src={coverImage} 
                  alt={catName} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/55 transition-colors duration-300"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-20 text-left">
                  <span className="text-xs text-secondary uppercase tracking-widest font-bold">Curated Collection</span>
                  <h3 className="font-headings text-2xl font-bold mt-1">{catName}</h3>
                  <p className="text-xs text-gray-300 mt-1">{count} Artworks Online</p>
                  <span className="text-xs uppercase mt-3 inline-flex items-center gap-2 group-hover:text-secondary transition-colors font-bold tracking-wider">
                    Explore Collection <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[#F6E7D8]/10 dark:bg-[#121111]/10 w-full border-t border-b border-gray-50 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Handpicked Luxury</span>
            <h2 className="text-3xl sm:text-4xl font-headings font-bold">Featured Products</h2>
            <div className="w-16 h-0.5 bg-primary dark:bg-secondary mx-auto mt-4"></div>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-[#121111] border border-dashed border-gray-250 dark:border-zinc-800 rounded-lg">
              <ShoppingBag className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" size={40} />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No Featured Products Available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="pt-16 pb-12 bg-[#F6E7D8]/10 dark:bg-zinc-950/30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Customer Favorites</span>
            <h2 className="text-3xl sm:text-4xl font-headings font-bold">Our Best Sellers</h2>
            <div className="w-16 h-0.5 bg-primary dark:bg-secondary mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bestSellers.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="pt-12 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Freshly Printed</span>
          <h2 className="text-3xl sm:text-4xl font-headings font-bold">New Arrivals</h2>
          <div className="w-16 h-0.5 bg-primary dark:bg-secondary mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {newArrivals.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[#F6E7D8]/20 dark:bg-zinc-950/60 w-full border-t border-b border-gray-50 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Our Promise</span>
            <h2 className="text-3xl sm:text-4xl font-headings font-bold">Why Choose Kalankari</h2>
            <div className="w-16 h-0.5 bg-primary dark:bg-secondary mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex items-start gap-4 p-8 bg-white dark:bg-[#121111] shadow-sm border border-gray-100 dark:border-gray-900 rounded-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="p-3 bg-[#F6E7D8]/50 text-primary dark:bg-zinc-800 dark:text-secondary text-2xl rounded-md flex-shrink-0">
                <Award size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-headings text-lg font-bold mb-2">Premium Fabric</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Pure Chanderi Silk, Soft Cotton Lurex, and Georgette blend options built to wear like art.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-8 bg-white dark:bg-[#121111] shadow-sm border border-gray-100 dark:border-gray-900 rounded-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="p-3 bg-[#F6E7D8]/50 text-primary dark:bg-zinc-800 dark:text-secondary text-2xl rounded-md flex-shrink-0">
                <Award size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-headings text-lg font-bold mb-2">High-Definition Prints</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Absolute precision dye rendering ensuring Peacock and Floral motifs look sharp and vibrant.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-8 bg-white dark:bg-[#121111] shadow-sm border border-gray-100 dark:border-gray-900 rounded-lg transition-transform duration-300 hover:-translate-y-1">
              <div className="p-3 bg-[#F6E7D8]/50 text-primary dark:bg-zinc-800 dark:text-secondary text-2xl rounded-md flex-shrink-0">
                <RefreshCw size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-headings text-lg font-bold mb-2">Exchange Desk</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Need a different size or print? Request an exchange easily within 7 days of delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        <span className="text-primary dark:text-secondary uppercase tracking-[0.2em] font-semibold text-xs block mb-3">Loved by Women</span>
        <h2 className="text-3xl font-headings font-bold mb-10">Customer Reviews</h2>
        
        <div className="relative min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-1 text-secondary mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" className="text-secondary" />
                ))}
              </div>
              <p className="text-sm sm:text-base italic text-gray-600 dark:text-gray-300 max-w-2xl px-4 leading-relaxed">
                &quot;{testimonials[activeTestimonial].review}&quot;
              </p>
              <h4 className="font-headings font-semibold text-xs sm:text-sm mt-6 uppercase tracking-wider text-gray-900 dark:text-white">
                — {testimonials[activeTestimonial].name}, {testimonials[activeTestimonial].loc}
              </h4>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex justify-center gap-3 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'bg-primary w-6' : 'bg-gray-300 dark:bg-zinc-700'}`}
              onClick={() => setActiveTestimonial(i)}
              aria-label={`Go to review ${i + 1}`}
            ></button>
          ))}
        </div>
      </section>



    </div>
  );
}
