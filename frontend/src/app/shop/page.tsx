"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
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

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL param parsing
  const initialSearch = searchParams.get('search') || "";
  const initialCategory = searchParams.get('category') || null;

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [maxPrice, setMaxPrice] = useState(4000);
  const [sortBy, setSortBy] = useState("popularity");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state with URL params if they change
  useEffect(() => {
    setSearch(searchParams.get('search') || "");
    setSelectedCategory(searchParams.get('category') || null);
  }, [searchParams]);

  // Fetch catalog from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();
        if (res.ok) {
          setDbProducts(data);
        }
      } catch (err) {
        console.error("Fetch shop products failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    "Floral Collection",
    "Festive Collection",
    "Premium Collection"
  ];

  // Filter products logic
  useEffect(() => {
    let filtered = [...dbProducts];

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.name || '').toLowerCase().includes(term) || 
        (p.fabric || '').toLowerCase().includes(term) ||
        (p.color || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term) ||
        (p._id || p.id || '').toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => getNormalizedCollection(p) === selectedCategory);
    }

    filtered = filtered.filter(p => p.price <= maxPrice);

    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      // Popularity (based on reviewsCount)
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    setProducts(filtered);
  }, [search, selectedCategory, maxPrice, sortBy, dbProducts]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setMaxPrice(4000);
    setSortBy("popularity");
    router.push('/shop');
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h3 className="font-headings font-bold text-lg text-gray-800 dark:text-gray-150">Filters</h3>
        {(search || selectedCategory || maxPrice < 4000) && (
          <button 
            onClick={clearFilters} 
            className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-secondary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Categories</h4>
        <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors text-left">
              <input 
                type="checkbox" 
                checked={selectedCategory === cat}
                onChange={() => {
                  const nextCat = selectedCategory === cat ? null : cat;
                  setSelectedCategory(nextCat);
                  if (nextCat) {
                    router.push(`/shop?category=${encodeURIComponent(nextCat)}`);
                  } else {
                    router.push('/shop');
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 border-t border-gray-50 dark:border-zinc-900 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left">Max Price</h4>
        <input 
          type="range" 
          min="1000" 
          max="4000" 
          step="100" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary bg-gray-200 dark:bg-zinc-850 h-1.5 rounded-lg appearance-none cursor-pointer" 
        />
        <div className="flex justify-between text-[11px] mt-2 font-semibold text-gray-500 dark:text-gray-400">
          <span>₹1,000</span>
          <span>₹{maxPrice.toLocaleString()}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-screen">
      <div className="flex gap-8 items-start relative w-full">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm sticky top-24">
          <SidebarContent />
        </aside>

        {/* Product Grid area */}
        <main className="flex-grow w-full">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-900 mb-8 gap-4">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-850 rounded text-xs bg-transparent dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder-gray-400"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={14} />
            </div>

            {/* Sort and Mobile toggles */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-gray-200 dark:border-zinc-800 py-2 px-4 rounded text-xs font-semibold hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Sort By:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent dark:bg-[#121111] border border-gray-200 dark:border-zinc-850 rounded py-2 px-3 text-xs outline-none font-semibold text-gray-700 dark:text-gray-300 focus:border-primary"
                >
                  <option value="popularity">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results feedback */}
          {(search || selectedCategory) && (
            <div className="mb-6 text-left text-xs text-gray-500 flex flex-wrap gap-2 items-center">
              <span>Active filters:</span>
              {search && (
                <span className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Search: &quot;{search}&quot;
                  <button onClick={() => setSearch("")} className="hover:text-red-500 font-bold">&times;</button>
                </span>
              )}
              {selectedCategory && (
                <span className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Category: {selectedCategory}
                  <button onClick={() => { setSelectedCategory(null); router.push('/shop'); }} className="hover:text-red-500 font-bold">&times;</button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="py-24 text-center text-gray-400 bg-white dark:bg-[#121111] rounded-lg border border-dashed border-gray-200 dark:border-zinc-850">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
              <span>Loading premium collections...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center text-gray-400 bg-white dark:bg-[#121111] rounded-lg border border-dashed border-gray-200 dark:border-zinc-850">
              <SlidersHorizontal className="mx-auto mb-4 text-gray-300 dark:text-zinc-700" size={48} />
              <h4 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-1">No matches found</h4>
              <p className="text-xs max-w-sm mx-auto">Try clearing your filters or widening your maximum price constraint.</p>
              <button 
                onClick={clearFilters} 
                className="mt-6 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-colors shadow"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Slide-out Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm lg:hidden flex justify-start transition-opacity duration-300" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="w-80 bg-[#FFFDF9] dark:bg-[#0F0E0E] h-full p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-4">
              <h3 className="font-headings font-bold text-lg text-primary">Filters</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-2xl hover:text-primary">&times;</button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-1">
              <SidebarContent />
            </div>

            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="bg-primary hover:bg-primary-hover text-white py-3.5 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow mt-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
