"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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

const sizes = ["S", "M", "L", "XL", "XXL"];

const priceRanges = [
  { label: "Under ₹1,500", min: 0, max: 1499 },
  { label: "₹1,500 - ₹2,000", min: 1500, max: 2000 },
  { label: "₹2,000 - ₹2,500", min: 2001, max: 2500 },
  { label: "₹2,500 - ₹3,000", min: 2501, max: 3000 },
  { label: "Above ₹3,000", min: 3001, max: 99999 }
];

const collections = [
  "Floral Collection",
  "Festive Collection",
  "Premium Collection"
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Array states for multi-select
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState("popularity");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    setSearch(searchParams.get('search') || "");
    
    const colls = searchParams.get('collections');
    setSelectedCollections(colls ? colls.split(',') : []);
    
    const fabs = searchParams.get('fabrics');
    setSelectedFabrics(fabs ? fabs.split(',') : []);
    
    const cols = searchParams.get('colors');
    setSelectedColors(cols ? cols.split(',') : []);
    
    const szs = searchParams.get('sizes');
    setSelectedSizes(szs ? szs.split(',') : []);
    
    const prs = searchParams.get('priceRanges');
    setSelectedPriceRanges(prs ? prs.split(',') : []);
    
    const sort = searchParams.get('sortBy');
    if (sort) setSortBy(sort);
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

  // Dynamically extract active fabrics and colors from the DB products list
  const fabrics = useMemo(() => {
    const set = new Set<string>();
    dbProducts.forEach(p => {
      if (p.fabric) {
        const cleanFab = p.fabric.trim();
        if (cleanFab) set.add(cleanFab);
      }
    });
    return Array.from(set).sort();
  }, [dbProducts]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    dbProducts.forEach(p => {
      if (p.color) {
        const cleanCol = p.color.trim();
        if (cleanCol) set.add(cleanCol);
      }
    });
    return Array.from(set).sort();
  }, [dbProducts]);

  // Helper to push updates to URL
  const updateUrl = (
    newColls: string[],
    newFabrics: string[],
    newColors: string[],
    newSizes: string[],
    newPriceRanges: string[],
    newSort: string = sortBy
  ) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (newColls.length > 0) params.set('collections', newColls.join(','));
    if (newFabrics.length > 0) params.set('fabrics', newFabrics.join(','));
    if (newColors.length > 0) params.set('colors', newColors.join(','));
    if (newSizes.length > 0) params.set('sizes', newSizes.join(','));
    if (newPriceRanges.length > 0) params.set('priceRanges', newPriceRanges.join(','));
    if (newSort !== "popularity") params.set('sortBy', newSort);
    
    const query = params.toString();
    router.push(`/shop${query ? `?${query}` : ''}`, { scroll: false });
  };

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

    if (selectedCollections.length > 0) {
      filtered = filtered.filter(p => selectedCollections.includes(getNormalizedCollection(p)));
    }

    if (selectedFabrics.length > 0) {
      filtered = filtered.filter(p => p.fabric && selectedFabrics.includes(p.fabric.trim()));
    }

    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => p.color && selectedColors.includes(p.color.trim()));
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => p.size && p.size.some((s: string) => selectedSizes.includes(s)));
    }

    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(p => {
        return selectedPriceRanges.some(rangeLabel => {
          const matchedRange = priceRanges.find(r => r.label === rangeLabel);
          if (!matchedRange) return false;
          return p.price >= matchedRange.min && p.price <= matchedRange.max;
        });
      });
    }

    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    setProducts(filtered);
  }, [search, selectedCollections, selectedFabrics, selectedColors, selectedSizes, selectedPriceRanges, sortBy, dbProducts]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCollections([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedPriceRanges([]);
    router.push('/shop', { scroll: false });
  };

  const handleCheckboxToggle = (val: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, type: 'collections' | 'fabrics' | 'colors' | 'sizes' | 'priceRanges') => {
    const next = list.includes(val) ? list.filter(item => item !== val) : [...list, val];
    setList(next);
    
    // Trigger URL sync
    if (type === 'collections') updateUrl(next, selectedFabrics, selectedColors, selectedSizes, selectedPriceRanges);
    if (type === 'fabrics') updateUrl(selectedCollections, next, selectedColors, selectedSizes, selectedPriceRanges);
    if (type === 'colors') updateUrl(selectedCollections, selectedFabrics, next, selectedSizes, selectedPriceRanges);
    if (type === 'sizes') updateUrl(selectedCollections, selectedFabrics, selectedColors, next, selectedPriceRanges);
    if (type === 'priceRanges') updateUrl(selectedCollections, selectedFabrics, selectedColors, selectedSizes, next);
  };

  const SidebarContent = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-headings font-bold text-lg text-gray-800 dark:text-gray-150">Filters</h3>
        {(search || selectedCollections.length > 0 || selectedFabrics.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || selectedPriceRanges.length > 0) && (
          <button 
            onClick={clearFilters} 
            className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-secondary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Collection Filter */}
      <div className="text-left">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Collections</h4>
        <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          {collections.map(coll => (
            <label key={coll} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors">
              <input 
                type="checkbox" 
                checked={selectedCollections.includes(coll)}
                onChange={() => handleCheckboxToggle(coll, selectedCollections, setSelectedCollections, 'collections')}
                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
              />
              <span>{coll}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fabric/Material Filter */}
      {fabrics.length > 0 && (
        <div className="text-left border-t border-gray-50 dark:border-zinc-900 pt-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Fabric</h4>
          <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400 max-h-40 overflow-y-auto pr-1">
            {fabrics.map(fab => (
              <label key={fab} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedFabrics.includes(fab)}
                  onChange={() => handleCheckboxToggle(fab, selectedFabrics, setSelectedFabrics, 'fabrics')}
                  className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
                />
                <span>{fab}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="text-left border-t border-gray-50 dark:border-zinc-900 pt-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Colour</h4>
          <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400 max-h-48 overflow-y-auto pr-1">
            {colors.map(col => (
              <label key={col} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedColors.includes(col)}
                  onChange={() => handleCheckboxToggle(col, selectedColors, setSelectedColors, 'colors')}
                  className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
                />
                <span className="capitalize">{col}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Size Filter */}
      <div className="text-left border-t border-gray-50 dark:border-zinc-900 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Sizes</h4>
        <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          {sizes.map(sz => (
            <label key={sz} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors">
              <input 
                type="checkbox" 
                checked={selectedSizes.includes(sz)}
                onChange={() => handleCheckboxToggle(sz, selectedSizes, setSelectedSizes, 'sizes')}
                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
              />
              <span>Size {sz}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Ranges Filter */}
      <div className="text-left border-t border-gray-50 dark:border-zinc-900 pt-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">Price</h4>
        <div className="flex flex-col gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          {priceRanges.map(pr => (
            <label key={pr.label} className="flex items-center gap-2.5 cursor-pointer hover:text-primary dark:hover:text-secondary transition-colors">
              <input 
                type="checkbox" 
                checked={selectedPriceRanges.includes(pr.label)}
                onChange={() => handleCheckboxToggle(pr.label, selectedPriceRanges, setSelectedPriceRanges, 'priceRanges')}
                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary accent-primary" 
              />
              <span>{pr.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('search', e.target.value);
                  else params.delete('search');
                  router.push(`/shop?${params.toString()}`, { scroll: false });
                }}
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
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateUrl(selectedCollections, selectedFabrics, selectedColors, selectedSizes, selectedPriceRanges, e.target.value);
                  }}
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

          {/* Results feedback with Active Filter Tags */}
          {(search || selectedCollections.length > 0 || selectedFabrics.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || selectedPriceRanges.length > 0) && (
            <div className="mb-6 text-left text-xs text-gray-500 flex flex-wrap gap-2 items-center">
              <span>Active filters:</span>
              {search && (
                <span className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Search: &quot;{search}&quot;
                  <button onClick={() => { setSearch(""); const params = new URLSearchParams(searchParams); params.delete('search'); router.push(`/shop?${params.toString()}`, { scroll: false }); }} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              )}
              {selectedCollections.map(coll => (
                <span key={coll} className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Collection: {coll}
                  <button onClick={() => handleCheckboxToggle(coll, selectedCollections, setSelectedCollections, 'collections')} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              ))}
              {selectedFabrics.map(fab => (
                <span key={fab} className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Fabric: {fab}
                  <button onClick={() => handleCheckboxToggle(fab, selectedFabrics, setSelectedFabrics, 'fabrics')} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              ))}
              {selectedColors.map(col => (
                <span key={col} className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Colour: {col}
                  <button onClick={() => handleCheckboxToggle(col, selectedColors, setSelectedColors, 'colors')} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              ))}
              {selectedSizes.map(sz => (
                <span key={sz} className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Size: {sz}
                  <button onClick={() => handleCheckboxToggle(sz, selectedSizes, setSelectedSizes, 'sizes')} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              ))}
              {selectedPriceRanges.map(pr => (
                <span key={pr} className="bg-gray-100 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded flex items-center gap-1.5 font-semibold">
                  Price: {pr}
                  <button onClick={() => handleCheckboxToggle(pr, selectedPriceRanges, setSelectedPriceRanges, 'priceRanges')} className="hover:text-red-500 font-bold ml-1">&times;</button>
                </span>
              ))}
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
              <p className="text-xs max-w-sm mx-auto">Try clearing your filters or widening your search query.</p>
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
          <div className="w-80 bg-[#FFFDF9] dark:bg-[#0F0E0E] h-full p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 text-left animate-slide-in-left" onClick={(e) => e.stopPropagation()}>
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
