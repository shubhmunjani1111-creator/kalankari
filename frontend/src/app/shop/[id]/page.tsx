"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, ShieldAlert, Truck, RefreshCw, Heart, ShoppingBag, ArrowLeft, Plus, Minus, Info, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';
import { PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetail({ params }: { params: any }) {
  const unwrappedParams = params && typeof params.then === 'function' ? use(params) : params;
  const id = unwrappedParams.id;
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { token, isAuthenticated } = useAuth();

  // States
  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("specs");
  const [imgError, setImgError] = useState<{ [key: number]: boolean }>({});

  // Review Form States
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [reviewErrorMsg, setReviewErrorMsg] = useState("");

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
      const data = await res.json();
      if (res.ok) {
        setProduct(data);
        setSelectedSize(data.size[0] || "M");

        // Fetch related items from DB
        const allRes = await fetch(`${API_BASE_URL}/api/products`);
        const allData = await allRes.json();
        if (allRes.ok) {
          const filtered = allData
            .filter((p: any) => p._id !== data._id && (p.category === data.category || p.fabric === data.fabric))
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      }
    } catch (err) {
      console.error("Fetch details failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product and related products from database
  useEffect(() => {
    if (!id) return;
    fetchProductDetails();
  }, [id]);

  // Reset image selection when changing product
  useEffect(() => {
    setSelectedImageIdx(0);
    setQty(1);
    setReviewSuccessMsg("");
    setReviewErrorMsg("");
  }, [id]);

  // Submit Review Handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!reviewComment.trim()) {
      setReviewErrorMsg("Review comment cannot be empty.");
      return;
    }

    setSubmittingReview(true);
    setReviewSuccessMsg("");
    setReviewErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${product._id || product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: userRating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg("Thank you! Your rating and review has been submitted successfully.");
        setReviewComment("");
        setUserRating(5);
        // Refresh product details to show new review dynamically
        await fetchProductDetails();
      } else {
        setReviewErrorMsg(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Submit review failed:", err);
      setReviewErrorMsg("Network error. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-xs text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <span>Retrieving kurti details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center flex flex-col items-center justify-center gap-4">
        <ShieldAlert size={64} className="text-primary animate-pulse" />
        <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-gray-200">Artwork Not Found</h1>
        <p className="text-sm text-gray-500 max-w-md">The product with ID &quot;{id}&quot; does not exist or has been removed from our digital print collections.</p>
        <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors rounded shadow mt-4">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product._id || product.id);
  const isOutOfStock = product.availability === 'Out of Stock' || product.stockCount <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      fabric: product.fabric,
      selectedSize
    }, qty);
  };

  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]
    });
  };

  // Schema Markup
  const productSchemaJson = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "Kalankari"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewsCount
    }
  };

  const currentImageSrc = imgError[selectedImageIdx] 
    ? "/logo.jpg" 
    : (product.images[selectedImageIdx] || "/logo.jpg");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemaJson) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-8 text-left">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={10} />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <ChevronRight size={10} />
          <span className="text-gray-500 font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          
          {/* Gallery Showcase */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-850 relative rounded-lg shadow-sm">
              <img 
                src={currentImageSrc} 
                alt={`${product.name} Preview`} 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-750" 
              />
              
              {/* Badges */}
              {product.isBestSeller && (
                <span className="absolute top-4 left-4 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded shadow-sm">
                  Best Seller
                </span>
              )}
              {isOutOfStock && (
                <span className="absolute top-4 left-4 bg-zinc-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded shadow-sm">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Thumbnails row */}
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {product.images.map((img: string, idx: number) => {
                const thumbnailSrc = imgError[idx] ? "/logo.jpg" : img;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`aspect-[3/4] rounded border overflow-hidden bg-gray-50 dark:bg-zinc-900 transition-all ${selectedImageIdx === idx ? 'border-primary ring-1 ring-primary' : 'border-gray-250 dark:border-zinc-800 hover:border-primary'}`}
                  >
                    <img 
                      src={thumbnailSrc} 
                      alt={`${product.name} thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={() => setImgError(prev => ({ ...prev, [idx]: true }))}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details & Interactive forms */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs uppercase text-secondary font-bold tracking-wider">{product.category}</span>
              <h1 className="font-headings text-3xl sm:text-4xl font-bold mt-1 text-gray-800 dark:text-white leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-3 mt-3">
                <div className="flex text-secondary items-center gap-0.5">
                  {[...Array(5)].map((_, i: number) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < Math.floor(product.rating) ? "currentColor" : "none"} 
                      className="text-secondary" 
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">{product.rating}</span>
                </div>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500">({product.reviewsCount} Verified Buyer Reviews)</span>
              </div>
            </div>

            {/* Price display block */}
            <div className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-zinc-900 pb-5">
              <span className="text-3xl font-bold text-primary dark:text-secondary">₹{product.price.toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 px-2.5 py-1 rounded">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Specifications Quick Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 py-4 text-xs">
              <p className="flex justify-between border-b pb-2 border-gray-50 dark:border-zinc-900"><span className="text-gray-400 font-medium">Fabric</span> <span className="font-bold text-gray-750 dark:text-gray-200">{product.fabric}</span></p>
              <p className="flex justify-between border-b pb-2 border-gray-50 dark:border-zinc-900"><span className="text-gray-400 font-medium">Color</span> <span className="font-bold text-gray-750 dark:text-gray-200">{product.color}</span></p>
              <p className="flex justify-between border-b pb-2 border-gray-50 dark:border-zinc-900"><span className="text-gray-400 font-medium">Sleeve Type</span> <span className="font-bold text-gray-750 dark:text-gray-200">{product.sleeveType}</span></p>
              <p className="flex justify-between border-b pb-2 border-gray-50 dark:border-zinc-900"><span className="text-gray-400 font-medium">Neckline</span> <span className="font-bold text-gray-750 dark:text-gray-200">{product.neckType}</span></p>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed font-normal">{product.description}</p>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Select Size</span>
                <span className="text-[10px] uppercase font-bold text-secondary cursor-pointer hover:underline flex items-center gap-1">
                  Size Guide
                </span>
              </div>
              <div className="flex gap-2">
                {product.size.map((sz: string) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-11 h-11 rounded border flex items-center justify-center font-bold text-xs transition-all ${selectedSize === sz ? 'bg-primary text-white border-primary shadow' : 'border-gray-250 dark:border-zinc-800 text-gray-750 dark:text-gray-300 hover:border-primary'}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty & Actions block */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              {/* Quantity selector */}
              <div className="flex items-center justify-between border border-gray-250 dark:border-zinc-800 py-3 px-4 w-full sm:w-28 bg-white dark:bg-zinc-900 rounded">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))} 
                  disabled={isOutOfStock}
                  className="font-bold text-gray-400 hover:text-primary transition-colors disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{isOutOfStock ? 0 : qty}</span>
                <button 
                  onClick={() => setQty(Math.min(product.stockCount, qty + 1))} 
                  disabled={isOutOfStock || qty >= product.stockCount}
                  className="font-bold text-gray-400 hover:text-primary transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add To Bag */}
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white flex-grow py-3.5 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} />
                {isOutOfStock ? 'Sold Out' : 'Add To Bag'}
              </button>

              {/* Wishlist Toggle */}
              <button 
                onClick={handleWishlistToggle}
                className={`border rounded p-3.5 transition-colors shadow-sm flex items-center justify-center ${isWishlisted ? 'border-primary/20 bg-red-50/20' : 'border-gray-250 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={16} fill={isWishlisted ? "#8B2635" : "none"} className={isWishlisted ? "text-primary border-none" : "text-gray-500"} />
              </button>
            </div>

            {/* Low stock notice */}
            {!isOutOfStock && product.stockCount <= product.lowStockThreshold && (
              <p className="text-[11px] font-semibold text-red-500 bg-red-50/50 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded flex items-center gap-2 border border-red-100 dark:border-red-950/40">
                <Info size={12} />
                Hurry! Only {product.stockCount} items left in stock.
              </p>
            )}

            {/* Specifications Tab details */}
            <div className="mt-8 border-t border-gray-100 dark:border-zinc-900 pt-6">
              <div className="flex border-b border-gray-100 dark:border-zinc-900 gap-6 text-sm font-bold">
                <button 
                  onClick={() => setActiveTab("specs")} 
                  className={`pb-2.5 transition-all uppercase text-xs tracking-wider ${activeTab === 'specs' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Specifications
                </button>
                <button 
                  onClick={() => setActiveTab("shipping")} 
                  className={`pb-2.5 transition-all uppercase text-xs tracking-wider ${activeTab === 'shipping' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Shipping & Returns
                </button>
                <button 
                  onClick={() => setActiveTab("reviews")} 
                  className={`pb-2.5 transition-all uppercase text-xs tracking-wider ${activeTab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Reviews ({product.reviewsCount || 0})
                </button>
              </div>
              
              <div className="py-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                {activeTab === 'specs' && (
                  <div className="flex flex-col gap-2.5">
                    <p><strong>Silhouette:</strong> Straight A-Line fit</p>
                    <p><strong>Sleeve Length:</strong> {product.sleeveType}</p>
                    <p><strong>Neck Pattern:</strong> {product.neckType}</p>
                    <p><strong>Fabric:</strong> {product.fabric}</p>
                    <p><strong>Care Instructions:</strong> {product.care || product.careInstructions}</p>
                  </div>
                )}
                {activeTab === 'shipping' && (
                  <div className="flex flex-col gap-2.5">
                    <p className="flex items-center gap-2"><Truck size={14} /> <span>Pan-India Delivery across 18,000+ pin codes. Orders are processed within 24 hours.</span></p>
                    <p className="flex items-center gap-2"><RefreshCw size={14} /> <span>Standard delivery: 4-7 business days. Express: 2-3 business days.</span></p>
                    <p className="flex items-center gap-2"><Info size={14} /> <span>Easy sizing & design exchanges inside 7 days of delivery. Keep tags attached.</span></p>
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="flex flex-col gap-6 text-left">
                    {/* Existing Reviews List */}
                    <div className="flex flex-col gap-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Customer Feedback</h4>
                      {(!product.reviews || product.reviews.length === 0) ? (
                        <p className="text-gray-400 italic">No reviews yet for this kurti design. Be the first to leave a feedback rating!</p>
                      ) : (
                        <div className="flex flex-col gap-4 divide-y divide-gray-100 dark:divide-zinc-900">
                          {product.reviews.map((rev: any, idx: number) => (
                            <div key={idx} className="pt-4 first:pt-0 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">{rev.userName}</span>
                                <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                              </div>
                              <div className="flex text-secondary items-center gap-0.5">
                                {[...Array(5)].map((_, i: number) => (
                                  <Star 
                                    key={i} 
                                    size={10} 
                                    fill={i < rev.rating ? "currentColor" : "none"} 
                                    className="text-secondary" 
                                  />
                                ))}
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{rev.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Review Form */}
                    <div className="border-t border-gray-100 dark:border-zinc-900 pt-6 mt-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-4">Write a Review</h4>
                      {isAuthenticated ? (
                        <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                          {reviewSuccessMsg && (
                            <p className="text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 p-2.5 rounded">
                              {reviewSuccessMsg}
                            </p>
                          )}
                          {reviewErrorMsg && (
                            <p className="text-[11px] font-semibold text-red-500 bg-red-50/50 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded">
                              {reviewErrorMsg}
                            </p>
                          )}
                          
                          {/* Rating selector stars */}
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-gray-400 text-[10px] uppercase">Your Rating</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star: number) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setUserRating(star)}
                                  className="text-secondary hover:scale-110 transition-transform"
                                >
                                  <Star 
                                    size={18} 
                                    fill={star <= userRating ? "currentColor" : "none"} 
                                    className="text-secondary"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Review comment field */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="reviewComment" className="font-semibold text-gray-400 text-[10px] uppercase">Review Comments</label>
                            <textarea
                              id="reviewComment"
                              rows={3}
                              placeholder="Share your thoughts on the digital print quality, fitting, fabric feel, or design elegance..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full p-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white font-bold uppercase tracking-wider text-[10px] py-2 px-5 rounded self-start transition-colors"
                          >
                            {submittingReview ? 'Submitting feedback...' : 'Submit Review'}
                          </button>
                        </form>
                      ) : (
                        <p className="text-gray-400 italic">
                          Please <Link href={`/auth?redirect=/shop/${product._id || product.id}`} className="text-secondary hover:underline font-bold">login to your account</Link> to share your rating feedback and review comments.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-150 dark:border-zinc-900 w-full text-left">
            <h3 className="font-headings text-2xl font-bold mb-8 text-gray-800 dark:text-white">You May Also Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
