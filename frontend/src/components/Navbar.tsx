"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Moon, Sun, Heart, ShoppingBag, User, 
  Menu, X, Trash2, ChevronRight, Home, Flame, History, Plus, Minus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { PRODUCTS } from '@/data/products';

// Levenshtein Distance for Typo Correction
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getTypoCorrection = (val: string): string | null => {
  const targets = ["floral", "festive", "premium", "peacock", "mughal", "cotton", "silk", "chanderi", "linen", "anarkali", "georgette"];
  for (const t of targets) {
    if (levenshteinDistance(val.toLowerCase(), t) <= 2) {
      return t;
    }
  }
  return null;
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart, removeFromCart, updateQty, subtotal, tax, grandTotal } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const pathname = usePathname();
  const router = useRouter();

  // Navigation open states
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof PRODUCTS>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const announcements = [
    "Free Shipping on Orders Above ₹1,499!",
    "New Festive Silk Collection is now Live!",
    "Easy Returns & Exchanges within 7 Days!"
  ];

  // Rotate announcements
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Theme & Recent Searches from LocalStorage (always force Light Mode)
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("kalankari_darkmode");

    const savedRecents = localStorage.getItem("kalankari_recent_searches");
    if (savedRecents) {
      setRecentSearches(JSON.parse(savedRecents));
    }
  }, []);

  // Live search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setTypoSuggestion(null);
      return;
    }

    const term = searchQuery.toLowerCase().trim();
    const matches = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.fabric.toLowerCase().includes(term) || 
      p.color.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term) ||
      p.price.toString().includes(term)
    );

    setSearchResults(matches);

    if (matches.length === 0) {
      setTypoSuggestion(getTypoCorrection(term));
    } else {
      setTypoSuggestion(null);
    }
  }, [searchQuery]);

  // Execute search submission
  const executeSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Add to recents
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("kalankari_recent_searches", JSON.stringify(updated));

    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(searchQuery);
    }
  };

  const clearRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("kalankari_recent_searches", JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isAdmin = user && user.email === "kalankari8972@gmail.com";
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  return (
    <>
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-primary text-accent text-[10px] sm:text-xs font-semibold py-2 px-4 text-center fixed top-0 w-full z-[60] flex items-center justify-between tracking-wide shadow-sm transition-all duration-300">
          <div className="mx-auto flex items-center gap-2 transition-opacity duration-300">
            <span className="inline-block w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
            <span>{announcements[announcementIdx]}</span>
          </div>
          <button 
            onClick={() => setShowAnnouncement(false)} 
            className="text-white hover:text-secondary text-sm font-bold leading-none p-1"
            aria-label="Close announcement"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className={`fixed ${showAnnouncement ? 'top-8' : 'top-0'} left-0 w-full z-50 transition-all duration-300 border-b border-gray-100 bg-[#FFFDF9]/90 backdrop-blur-md dark:bg-[#0F0E0E]/90 dark:border-gray-900 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/logo.jpg" 
              alt="Kalankari Logo" 
              className="h-14 w-14 object-contain rounded-full shadow-gold hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
                const fallback = document.getElementById('logo-fallback-nav');
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div id="logo-fallback-nav" style={{ display: 'none' }} className="text-2xl font-bold font-headings text-primary tracking-widest">
              Kalankari
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 font-medium text-xs tracking-wider uppercase">
            <Link href="/" className={`nav-link-anim hover:text-primary dark:hover:text-secondary ${pathname === "/" ? "text-primary dark:text-secondary font-bold border-b border-primary dark:border-secondary pb-1" : "text-gray-700 dark:text-gray-300"}`}>Home</Link>
            <Link href="/shop" className={`nav-link-anim hover:text-primary dark:hover:text-secondary ${pathname.startsWith("/shop") ? "text-primary dark:text-secondary font-bold border-b border-primary dark:border-secondary pb-1" : "text-gray-700 dark:text-gray-300"}`}>Shop</Link>
            <Link href="/about" className={`nav-link-anim hover:text-primary dark:hover:text-secondary ${pathname === "/about" ? "text-primary dark:text-secondary font-bold border-b border-primary dark:border-secondary pb-1" : "text-gray-700 dark:text-gray-300"}`}>About Us</Link>
            <Link href="/contact" className={`nav-link-anim hover:text-primary dark:hover:text-secondary ${pathname === "/contact" ? "text-primary dark:text-secondary font-bold border-b border-primary dark:border-secondary pb-1" : "text-gray-700 dark:text-gray-300"}`}>Contact</Link>
            {isAdmin && (
              <span className="text-[10px] px-2.5 py-0.5 bg-accent text-primary dark:bg-zinc-800 dark:text-secondary font-bold rounded-full border border-primary/20">
                Admin Mode
              </span>
            )}
          </nav>

          {/* Control Utility Icons */}
          <div className="flex items-center gap-4 sm:gap-6 text-gray-700 dark:text-gray-300 text-lg">
            
            {/* Search Toggle */}
            <button onClick={() => setSearchOpen(true)} className="hover:text-primary dark:hover:text-secondary transition-colors relative p-1" title="Search">
              <Search size={20} />
            </button>
   
            {/* Wishlist Icon */}
            <button onClick={() => setWishlistOpen(true)} className="hover:text-primary dark:hover:text-secondary transition-colors relative p-1" title="Wishlist">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-secondary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button onClick={() => setCartOpen(true)} className="hover:text-primary dark:hover:text-secondary transition-colors relative p-1" title="Cart">
              <ShoppingBag size={20} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <Link href={user ? '/dashboard' : '/auth'} className="hover:text-primary dark:hover:text-secondary transition-colors relative p-1" title="My Account">
              <User size={20} />
            </Link>

            {/* Mobile Menu Hamburguer Toggle */}
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden hover:text-primary dark:hover:text-secondary transition-colors p-1" title="Menu">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex justify-end transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-80 bg-[#FFFDF9] dark:bg-[#0F0E0E] h-full p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4">
              <div className="font-headings font-bold text-xl tracking-wider text-primary">Kalankari</div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-2xl hover:text-primary">&times;</button>
            </div>
            <nav className="flex flex-col gap-4 font-medium tracking-wide uppercase text-sm">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-50 dark:border-zinc-900 hover:text-primary dark:hover:text-secondary">Home</Link>
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-50 dark:border-zinc-900 hover:text-primary dark:hover:text-secondary">Shop</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-50 dark:border-zinc-900 hover:text-primary dark:hover:text-secondary">About Us</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-50 dark:border-zinc-900 hover:text-primary dark:hover:text-secondary">Contact</Link>
            </nav>
            <div className="mt-auto flex flex-col gap-4 border-t border-gray-150 dark:border-gray-800 pt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <User className="text-primary text-lg" size={18} />
                    <div className="text-left">
                      <div className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Welcome back</div>
                      <div className="font-semibold text-xs truncate max-w-[200px]">{user.name}</div>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-primary hover:bg-primary-hover text-white text-center py-2.5 text-xs font-semibold rounded transition-colors uppercase tracking-wider">
                    View Dashboard
                  </Link>
                  <button onClick={handleLogout} className="border border-gray-300 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 text-center py-2.5 text-xs font-semibold rounded transition-colors uppercase tracking-wider">
                    Log Out
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="bg-primary hover:bg-primary-hover text-white text-center py-2.5 text-xs font-semibold rounded transition-colors uppercase tracking-wider">
                  Log In / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sticky Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-[#FFFDF9]/95 dark:bg-[#0F0E0E]/95 border-t border-gray-150 dark:border-zinc-900 flex items-center justify-around py-3 px-2 shadow-lg backdrop-blur-md">
        <Link href="/" className={`flex flex-col items-center gap-1 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors ${pathname === "/" ? "text-primary dark:text-secondary font-bold" : ""}`}>
          <Home size={18} />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Home</span>
        </Link>
        <Link href="/shop" className={`flex flex-col items-center gap-1 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors ${pathname.startsWith("/shop") ? "text-primary dark:text-secondary font-bold" : ""}`}>
          <ShoppingBag size={18} />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Shop</span>
        </Link>
        <button onClick={() => setWishlistOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors relative">
          <Heart size={18} />
          {wishlist.length > 0 && (
            <span className="absolute top-[-4px] right-[4px] bg-secondary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {wishlist.length}
            </span>
          )}
          <span className="text-[9px] uppercase tracking-wider font-semibold">Wishlist</span>
        </button>
        <button onClick={() => setCartOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors relative">
          <ShoppingBag size={18} />
          {cartItemsCount > 0 && (
            <span className="absolute top-[-4px] right-[4px] bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartItemsCount}
            </span>
          )}
          <span className="text-[9px] uppercase tracking-wider font-semibold">Cart</span>
        </button>
        <Link href={user ? '/dashboard' : '/auth'} className={`flex flex-col items-center gap-1 text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors ${pathname === "/dashboard" || pathname === "/auth" ? "text-primary dark:text-secondary font-bold" : ""}`}>
          <User size={18} />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Account</span>
        </Link>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-[#1A1A1A]/70 backdrop-blur-md flex flex-col items-center pt-20 transition-opacity duration-300" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-white/20">
              <h3 className="font-headings text-xl font-bold tracking-wide text-white">Search Collections</h3>
              <button onClick={() => setSearchOpen(false)} className="text-3xl text-white hover:text-secondary transition-colors">&times;</button>
            </div>
            <div className="relative mt-6 shadow-xl">
              <input 
                type="text" 
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search by name, category, fabric, color..." 
                className="w-full bg-[#FFFDF9] dark:bg-[#1A1A1A] border-none outline-none py-3.5 px-5 text-sm sm:text-base font-medium shadow-inner rounded text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-secondary/55"
                autoComplete="off"
              />
              <button 
                onClick={() => executeSearch(searchQuery)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-primary dark:hover:text-secondary transition-colors"
                aria-label="Submit search"
              >
                <Search size={18} />
              </button>
            </div>
            
            {/* Auto Suggestions Panel */}
            <div className="bg-white dark:bg-[#121111] max-h-80 overflow-y-auto mt-2 rounded border border-gray-150 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-850 shadow-2xl">
              {searchQuery.trim().length === 0 ? (
                <div className="p-4 flex flex-col gap-4 text-left">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2.5 flex items-center gap-1">
                      <Flame size={12} className="text-secondary" /> Popular Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["Floral Collection", "Festive Collection", "Silk Blend", "Cotton Lurex", "Mayur Peacock"].map((term) => (
                        <button 
                          key={term} 
                          onClick={() => executeSearch(term)} 
                          className="text-xs bg-gray-50 hover:bg-[#F6E7D8]/30 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-gray-100 dark:border-zinc-800 py-1.5 px-3 rounded text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                  {recentSearches.length > 0 && (
                    <div className="mt-2 border-t border-gray-50 dark:border-zinc-900 pt-3">
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-1">
                        <History size={12} /> Recent Searches
                      </h4>
                      <div className="flex flex-col gap-2">
                        {recentSearches.map((term) => (
                          <div key={term} className="flex justify-between items-center text-xs">
                            <button 
                              onClick={() => executeSearch(term)} 
                              className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium text-left transition-colors"
                            >
                              {term}
                            </button>
                            <button 
                              onClick={(e) => clearRecentSearch(term, e)} 
                              className="text-gray-400 hover:text-red-500 text-sm font-bold px-1"
                              title="Remove"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 text-left">
                  {typoSuggestion ? (
                    <div className="text-sm">
                      <p>No results found for &quot;{searchQuery}&quot;.</p>
                      <p className="mt-2 text-xs text-gray-500">
                        Did you mean:{" "}
                        <button 
                          onClick={() => executeSearch(typoSuggestion)} 
                          className="text-primary dark:text-secondary font-bold underline hover:text-primary-hover"
                        >
                          {typoSuggestion}
                        </button>?
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-sm mb-1 text-gray-600 dark:text-gray-300">No Match Found</p>
                      <p>Try searching for &quot;Floral&quot;, &quot;Silk&quot;, &quot;Mughal&quot;, &quot;Bandhani&quot; collections.</p>
                    </div>
                  )}
                </div>
              ) : (
                searchResults.map((match) => (
                  <Link 
                    key={match.id} 
                    href={`/shop/${match.id}`} 
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-left"
                  >
                    <img 
                      src={match.images[0]} 
                      alt={match.name} 
                      className="w-12 h-16 object-cover bg-gray-50 rounded" 
                    />
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{match.name}</h4>
                      <p className="text-[10px] text-gray-400">{match.category} - {match.fabric} ({match.color})</p>
                    </div>
                    <div className="text-sm font-bold text-primary dark:text-secondary">₹{match.price}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Drawer Overlay */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex justify-end transition-opacity duration-300" onClick={() => setWishlistOpen(false)}>
          <div className="w-80 sm:w-96 bg-[#FFFDF9] dark:bg-[#0F0E0E] h-full p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-105 dark:border-gray-900 pb-4">
              <h3 className="font-headings font-bold text-lg text-gray-800 dark:text-gray-100">My Wishlist</h3>
              <button onClick={() => setWishlistOpen(false)} className="text-2xl hover:text-primary">&times;</button>
            </div>
            
            {/* Wishlist Items List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 h-64 text-center">
                  <Heart className="w-16 h-16 text-gray-200 dark:text-zinc-800" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Your wishlist is empty</h4>
                  <p className="text-[10px] text-gray-400 max-w-[200px]">Save your favorite printed kurtis to view them later.</p>
                  <Link href="/shop" onClick={() => setWishlistOpen(false)} className="bg-primary hover:bg-primary-hover text-white py-2 px-6 text-[10px] font-bold uppercase rounded tracking-wider">
                    Browse Shop
                  </Link>
                </div>
              ) : (
                wishlist.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 dark:border-zinc-900 pb-4 items-center text-left relative">
                    <img src={item.image} alt={item.name} className="w-16 h-22 object-cover bg-gray-50 rounded flex-shrink-0" />
                    <div className="flex-grow pr-6">
                      <h4 className="font-semibold text-sm leading-tight text-gray-800 dark:text-gray-100">{item.name}</h4>
                      <span className="font-bold text-primary dark:text-secondary text-sm block mt-1">₹{item.price}</span>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/shop/${item.id}`} onClick={() => setWishlistOpen(false)} className="bg-primary hover:bg-primary-hover text-white text-[9px] uppercase font-bold px-3 py-1.5 rounded tracking-wider transition-colors">
                          Details / Buy
                        </Link>
                      </div>
                    </div>
                    <button 
                      className="absolute top-0 right-0 text-gray-400 hover:text-red-500 text-sm font-bold leading-none p-1" 
                      onClick={() => toggleWishlist(item)}
                      title="Remove from wishlist"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex justify-end transition-opacity duration-300" onClick={() => setCartOpen(false)}>
          <div className="w-80 sm:w-96 bg-[#FFFDF9] dark:bg-[#0F0E0E] h-full p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4">
              <h3 className="font-headings font-bold text-lg text-gray-800 dark:text-gray-100">My Shopping Bag</h3>
              <button onClick={() => setCartOpen(false)} className="text-2xl hover:text-primary">&times;</button>
            </div>
            
            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 h-64 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-200 dark:text-zinc-800" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Your bag is empty</h4>
                  <p className="text-[10px] text-gray-400 max-w-[200px]">Add our beautiful digital printed kurtis to start styling.</p>
                  <Link href="/shop" onClick={() => setCartOpen(false)} className="bg-primary hover:bg-primary-hover text-white py-2 px-6 text-[10px] font-bold uppercase rounded tracking-wider">
                    Browse Shop
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 border-b border-gray-100 dark:border-zinc-900 pb-4 text-left relative">
                    <img src={item.image} alt={item.name} className="w-16 h-22 object-cover bg-gray-50 rounded flex-shrink-0" />
                    <div className="flex-grow flex flex-col justify-between pr-6">
                      <div>
                        <h4 className="font-semibold text-xs leading-snug text-gray-800 dark:text-gray-100 line-clamp-2">{item.name}</h4>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Size: <span className="font-bold text-gray-700 dark:text-gray-300">{item.selectedSize}</span> | Fabric: {item.fabric}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {/* Qty selectors */}
                        <div className="flex items-center border border-gray-250 dark:border-zinc-800 rounded overflow-hidden">
                          <button 
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-950 transition-colors" 
                            onClick={() => updateQty(item.id, item.selectedSize, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-zinc-900/50 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-950 transition-colors" 
                            onClick={() => updateQty(item.id, item.selectedSize, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="font-bold text-primary dark:text-secondary text-sm">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="absolute top-0 right-0 text-gray-400 hover:text-red-500 leading-none p-1"
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 dark:border-zinc-800 pt-4 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-left">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-semibold text-gray-850 dark:text-gray-100">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs text-left">
                  <span className="text-gray-500">GST (12%):</span>
                  <span className="font-semibold text-gray-850 dark:text-gray-100">₹{tax}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-zinc-800 pt-3 text-xs text-left">
                  <span className="font-bold">Grand Total:</span>
                  <span className="font-bold text-primary dark:text-secondary text-sm">₹{grandTotal}</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Link 
                    href="/cart" 
                    onClick={() => setCartOpen(false)}
                    className="border border-primary text-primary hover:bg-[#8B2635]/5 text-center py-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    View Full Cart
                  </Link>
                  <Link 
                    href="/checkout" 
                    onClick={() => setCartOpen(false)}
                    className="bg-primary hover:bg-primary-hover text-white text-center py-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-colors shadow"
                  >
                    Proceed To Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
