"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, ShieldAlert, Truck, RefreshCw, Heart, ShoppingBag, ArrowLeft, Plus, Minus, Info, ChevronRight, ChevronLeft, X, Camera, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetailClient({ params }: { params: any }) {
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

  // Paginated reviews list and stats states
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [reviewsAvgRating, setReviewsAvgRating] = useState(0);
  const [reviewsDistribution, setReviewsDistribution] = useState<any>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [reviewsCurrentPage, setReviewsCurrentPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsSortBy, setReviewsSortBy] = useState('newest');

  // Customer personal review state
  const [userExistingReview, setUserExistingReview] = useState<any | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Lightbox overlay state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number>(-1);

  const fetchProductReviews = async () => {
    try {
      const targetId = product?._id || product?.id || id;
      if (!targetId) return;
      const res = await fetch(
        `${API_BASE_URL}/api/products/${targetId}/reviews?sortBy=${reviewsSortBy}&page=${reviewsCurrentPage}&limit=5`
      );
      const data = await res.json();
      if (res.ok) {
        setReviewsList(data.reviews || []);
        setReviewsTotalCount(data.totalReviews || 0);
        setReviewsAvgRating(data.averageRating || 0);
        setReviewsDistribution(data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setReviewsTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const checkUserReview = async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('kalankari_prod_token') : null);
    const targetId = product?._id || product?.id || id;
    if (!activeToken || !targetId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/reviews/my-review?productId=${targetId}`,
        {
          headers: { 'Authorization': `Bearer ${activeToken}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUserExistingReview(data);
        if (data) {
          setUserRating(data.rating);
          setReviewTitle(data.title || "");
          setReviewComment(data.review);
          setReviewImages(data.images || []);
        }
      }
    } catch (err) {
      console.error("Failed to check customer review:", err);
    }
  };

  useEffect(() => {
    if (product) {
      fetchProductReviews();
    }
  }, [product, reviewsCurrentPage, reviewsSortBy]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkUserReview();
    }
  }, [product, isAuthenticated]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('writeReview') === 'true') {
        setActiveTab('reviews');
        setTimeout(() => {
          const element = document.getElementById('product-reviews-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    }
  }, []);

  const compressAndUploadImage = async (file: File) => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('kalankari_prod_token') : null);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_width = 800;
          const max_height = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_width) {
              height *= max_width / width;
              width = max_width;
            }
          } else {
            if (height > max_height) {
              width *= max_height / height;
              height = max_height;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          
          fetch(`${API_BASE_URL}/api/admin/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({ image: dataUrl })
          })
          .then(res => res.json())
          .then(data => {
            if (data.url) {
              resolve(data.url);
            } else {
              reject(new Error(data.error || "Upload response missing url"));
            }
          })
          .catch(err => reject(err));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - reviewImages.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload up to 5 images. You have ${reviewImages.length} uploaded already.`);
      return;
    }

    setUploadingImages(true);
    setReviewErrorMsg("");

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await compressAndUploadImage(files[i]);
        urls.push(url);
      }
      setReviewImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setReviewErrorMsg(err.message || "Failed to upload/compress review images.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDeleteReview = async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('kalankari_prod_token') : null);
    if (!userExistingReview || !activeToken) return;
    if (!confirm("Are you sure you want to delete your review? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${userExistingReview._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg("Your review has been deleted successfully.");
        setUserExistingReview(null);
        setIsEditingReview(false);
        setUserRating(5);
        setReviewTitle("");
        setReviewComment("");
        setReviewImages([]);
        await fetchProductReviews();
        if (product) {
          fetchProductDetails();
        }
      } else {
        setReviewErrorMsg(data.error || "Failed to delete review.");
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
      const data = await res.json();
      if (res.ok) {
        if (data.size && Array.isArray(data.size)) {
          const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];
          data.size.sort((a: string, b: string) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
        }
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('kalankari_prod_token') : null);
    if (!activeToken) {
      setReviewErrorMsg("Please log in to submit a review.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewErrorMsg("Review comments description cannot be empty.");
      return;
    }

    setSubmittingReview(true);
    setReviewSuccessMsg("");
    setReviewErrorMsg("");

    const isEdit = !!userExistingReview && isEditingReview;
    const url = isEdit 
      ? `${API_BASE_URL}/api/reviews/${userExistingReview._id}`
      : `${API_BASE_URL}/api/products/${product._id || product.id}/reviews`;
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          rating: userRating,
          title: reviewTitle,
          review: reviewComment,
          images: reviewImages
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg(
          isEdit 
            ? "Your review has been updated and sent for moderation approval."
            : "Thank you! Your rating and review has been submitted successfully for moderation approval."
        );
        setIsEditingReview(false);
        await checkUserReview();
        await fetchProductReviews();
        if (product) {
          fetchProductDetails();
        }
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

  const currentImageSrc = imgError[selectedImageIdx] 
    ? "/logo.jpg" 
    : (product.images[selectedImageIdx] || "/logo.jpg");

  return (
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
              alt={product.seo?.imageAlt || `${product.name} Preview`} 
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
                    alt={product.seo?.imageAlt ? `${product.seo.imageAlt} Thumbnail ${idx + 1}` : `${product.name} thumbnail ${idx + 1}`} 
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

          {/* Color Variants Selector */}
          {product.colorVariants && product.colorVariants.length > 1 && (
            <div className="mb-6 text-left">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Available Colours</span>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {product.colorVariants.map((variant: any) => {
                  const isSelected = variant._id === product._id;
                  const variantImg = variant.images?.[0] || "/logo.jpg";
                  return (
                    <Link
                      key={variant._id}
                      href={`/shop/${variant.seo?.slug || variant._id}`}
                      className={`group flex items-center gap-2 p-1.5 rounded-full border transition-all ${isSelected ? 'border-primary bg-primary/5 dark:bg-zinc-900 shadow-sm' : 'border-gray-250 dark:border-zinc-800 hover:border-primary bg-white dark:bg-black'}`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-150 dark:border-zinc-850">
                        <img src={variantImg} alt={variant.color} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10px] pr-2.5 font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'}`}>
                        {variant.color}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

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
          <div id="product-reviews-section" className="mt-8 border-t border-gray-100 dark:border-zinc-900 pt-6">
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
                Reviews ({reviewsTotalCount || product.reviewsCount || 0})
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
                  <p className="flex items-center gap-2"><RefreshCw size={14} /> <span>Standard delivery: 7-10 business days for Metro Cities, 10-12 days for Non-Metros, and 10-15 days for rest of India.</span></p>
                  <p className="flex items-center gap-2"><Info size={14} /> <span>Easy sizing & design exchanges inside 7 days of delivery. Keep tags attached.</span></p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-8 text-left">
                  {/* Rating distribution & overall statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50/50 dark:bg-zinc-900/30 p-5 sm:p-6 rounded-lg border border-gray-100 dark:border-zinc-900/50">
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-150 dark:border-zinc-900/50 pb-5 md:pb-0 md:pr-6">
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 dark:text-white leading-none">
                        {reviewsAvgRating > 0 ? reviewsAvgRating.toFixed(1) : (product.rating ? Number(product.rating).toFixed(1) : "0.0")}
                      </h2>
                      <div className="flex text-secondary items-center gap-1 mt-2.5">
                        {[...Array(5)].map((_, i) => {
                          const avg = reviewsAvgRating > 0 ? reviewsAvgRating : (product.rating || 0);
                          return (
                            <Star 
                              key={i} 
                              size={16} 
                              fill={i < Math.floor(avg) ? "currentColor" : "none"} 
                              className="text-secondary" 
                            />
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2.5">
                        Based on {reviewsTotalCount || product.reviewsCount || 0} Ratings
                      </p>
                    </div>

                    <div className="md:col-span-8 flex flex-col gap-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviewsDistribution[stars] || 0;
                        const percentage = reviewsTotalCount > 0 ? Math.round((count / reviewsTotalCount) * 105) / 1.05 : 0;
                        const cappedPct = Math.min(100, percentage);
                        return (
                          <div key={stars} className="flex items-center gap-3 text-[11px] text-gray-505">
                            <span className="w-12 text-right font-medium flex items-center justify-end gap-1">
                              {stars} <Star size={10} fill="currentColor" className="text-secondary" />
                            </span>
                            <div className="flex-grow bg-gray-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-secondary h-full rounded-full transition-all duration-500" 
                                style={{ width: `${cappedPct}%` }}
                              />
                            </div>
                            <span className="w-12 text-left font-semibold text-gray-700 dark:text-gray-300">
                              {Math.round(cappedPct)}% ({count})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* List Controls (Sort & Totals) */}
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-900 pb-3 gap-4">
                    <span className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">
                      Showing {reviewsList.length} of {reviewsTotalCount} reviews
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 font-semibold">Sort:</span>
                      <select 
                        value={reviewsSortBy} 
                        onChange={(e) => { setReviewsSortBy(e.target.value); setReviewsCurrentPage(1); }}
                        className="bg-transparent border border-gray-200 dark:border-zinc-850 px-2.5 py-1 rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:border-primary cursor-pointer text-xs"
                      >
                        <option value="newest" className="dark:bg-black">Newest First</option>
                        <option value="oldest" className="dark:bg-black">Oldest First</option>
                        <option value="highest" className="dark:bg-black">Highest Rated</option>
                        <option value="lowest" className="dark:bg-black">Lowest Rated</option>
                      </select>
                    </div>
                  </div>

                  {/* Existing Reviews List */}
                  <div className="flex flex-col gap-5">
                    {reviewsList.length === 0 ? (
                      <p className="text-gray-400 italic text-center py-6">No verified reviews have been approved for this design yet.</p>
                    ) : (
                      <div className="flex flex-col gap-6 divide-y divide-gray-100 dark:divide-zinc-900">
                        {reviewsList.map((rev: any) => (
                          <div key={rev._id} className="pt-6 first:pt-0 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                                  {rev.userId?.name || rev.userName}
                                </span>
                                {rev.isVerifiedPurchase && (
                                  <span className="bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                                    Verified Buyer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex text-secondary items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  fill={i < rev.rating ? "currentColor" : "none"} 
                                  className="text-secondary" 
                                />
                              ))}
                            </div>

                            {rev.title && (
                              <h5 className="font-bold text-gray-850 dark:text-white text-xs leading-snug">
                                {rev.title}
                              </h5>
                            )}

                            <p className="text-gray-650 dark:text-gray-300 text-xs leading-relaxed">
                              {rev.review}
                            </p>

                            {/* Review Images Thumbnails */}
                            {rev.images && rev.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {rev.images.map((img: string, idx: number) => (
                                  <button 
                                    key={idx}
                                    onClick={() => { setLightboxImages(rev.images); setLightboxIdx(idx); }}
                                    className="relative h-14 w-14 border border-gray-200 rounded overflow-hidden hover:opacity-80 transition-opacity cursor-zoom-in"
                                  >
                                    <img src={img} alt="review attachment" className="h-full w-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination indicators */}
                    {reviewsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button 
                          disabled={reviewsCurrentPage === 1}
                          onClick={() => setReviewsCurrentPage(prev => prev - 1)}
                          className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 disabled:opacity-40 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-50"
                        >
                          Prev
                        </button>
                        <span className="text-[10px] font-bold text-gray-400">
                          Page {reviewsCurrentPage} of {reviewsTotalPages}
                        </span>
                        <button 
                          disabled={reviewsCurrentPage === reviewsTotalPages}
                          onClick={() => setReviewsCurrentPage(prev => prev + 1)}
                          className="px-2.5 py-1 rounded border border-gray-200 text-gray-600 disabled:opacity-40 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add / Edit Review Form section */}
                  <div className="border-t border-gray-150 dark:border-zinc-900 pt-8 mt-4">
                    {isAuthenticated ? (
                      <div>
                        {userExistingReview && !isEditingReview ? (
                          <div className="bg-green-50/20 border border-green-200/40 p-5 rounded-lg flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-green-700">Your Submitted Review</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setIsEditingReview(true)}
                                  className="text-gray-505 hover:text-primary transition-colors p-1.5 bg-white dark:bg-zinc-800 border rounded"
                                  title="Edit Review"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  onClick={handleDeleteReview}
                                  className="text-gray-505 hover:text-red-500 transition-colors p-1.5 bg-white dark:bg-zinc-800 border rounded"
                                  title="Delete Review"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-xs flex flex-col gap-1.5">
                              <div className="flex text-secondary items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={11} fill={i < userExistingReview.rating ? "currentColor" : "none"} className="text-secondary" />
                                ))}
                              </div>
                              {userExistingReview.title && <p className="font-bold text-gray-800 dark:text-white">{userExistingReview.title}</p>}
                              <p className="text-gray-600 dark:text-gray-300 italic">{userExistingReview.review}</p>
                              {userExistingReview.images && userExistingReview.images.length > 0 && (
                                <div className="flex gap-1.5 mt-1.5">
                                  {userExistingReview.images.map((img: string, idx: number) => (
                                    <img key={idx} src={img} alt="attached user review" className="h-10 w-10 object-cover rounded border" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitReview} className="flex flex-col gap-5">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                {isEditingReview ? "Edit Your Review" : "Write a Review"}
                              </h4>
                              {isEditingReview && (
                                <button 
                                  type="button" 
                                  onClick={() => setIsEditingReview(false)}
                                  className="text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            {reviewSuccessMsg && (
                              <p className="text-[11px] font-semibold text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 p-2.5 rounded">
                                {reviewSuccessMsg}
                              </p>
                            )}
                            {reviewErrorMsg && (
                              <p className="text-[11px] font-semibold text-red-500 bg-red-50/55 dark:bg-red-950/20 dark:text-red-400 p-2.5 rounded">
                                {reviewErrorMsg}
                              </p>
                            )}

                            {/* Rating Stars selector */}
                            <div className="flex flex-col gap-1.5">
                              <span className="font-semibold text-gray-400 text-[10px] uppercase">Your Rating</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setUserRating(star)}
                                    className="text-secondary hover:scale-110 transition-transform"
                                  >
                                    <Star 
                                      size={20} 
                                      fill={star <= userRating ? "currentColor" : "none"} 
                                      className="text-secondary"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Title input */}
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="reviewTitle" className="font-semibold text-gray-400 text-[10px] uppercase">Review Title (Optional)</label>
                              <input
                                id="reviewTitle"
                                type="text"
                                placeholder="Summarize your experience (e.g. Beautiful fabric, perfect fitting)"
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                className="w-full p-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                              />
                            </div>

                            {/* Comment Textarea */}
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="reviewComment" className="font-semibold text-gray-400 text-[10px] uppercase">Review Details</label>
                              <textarea
                                id="reviewComment"
                                rows={3}
                                placeholder="Share details about the embroidery, digital printing, fabric comfort, size accuracy, etc."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="w-full p-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                              />
                            </div>

                            {/* Image uploading attachments */}
                            <div className="flex flex-col gap-2">
                              <span className="font-semibold text-gray-400 text-[10px] uppercase">Attach Photos (Up to 5)</span>
                              <div className="flex flex-wrap gap-3 items-center">
                                {reviewImages.map((img, index) => (
                                  <div key={index} className="relative h-16 w-16 border rounded overflow-hidden">
                                    <img src={img} alt="uploaded thumbnail" className="h-full w-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}

                                {reviewImages.length < 5 && (
                                  <label className={`h-16 w-16 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded cursor-pointer hover:border-primary hover:text-primary transition-all text-gray-400 bg-gray-50/50 ${uploadingImages ? 'animate-pulse pointer-events-none' : ''}`}>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      multiple 
                                      onChange={handleImageFileChange} 
                                      className="hidden" 
                                    />
                                    <Camera size={18} />
                                    <span className="text-[8px] font-bold uppercase tracking-wide mt-1">
                                      {uploadingImages ? 'Loading...' : 'Upload'}
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submittingReview || uploadingImages}
                              className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white font-bold uppercase tracking-wider text-[10px] py-2.5 px-6 rounded self-start transition-colors"
                            >
                              {submittingReview ? 'Submitting...' : (isEditingReview ? 'Update Review' : 'Submit Review')}
                            </button>
                          </form>
                        )}
                      </div>
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

      {/* Lightbox Gallery Modal */}
      {lightboxIdx !== -1 && lightboxImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 select-none">
          <button 
            onClick={() => setLightboxIdx(-1)} 
            className="absolute top-6 right-6 text-white hover:text-red-400 p-2.5 rounded-full bg-white/10 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
          
          <div className="relative max-w-4xl max-h-[80vh] flex items-center justify-center w-full gap-4">
            {lightboxImages.length > 1 && (
              <button 
                onClick={() => setLightboxIdx(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                className="text-white hover:bg-white/10 p-3 rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                <ChevronLeft size={36} />
              </button>
            )}
            
            <img 
              src={lightboxImages[lightboxIdx]} 
              alt="Review attachment zoomed view" 
              className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl" 
            />

            {lightboxImages.length > 1 && (
              <button 
                onClick={() => setLightboxIdx(prev => (prev + 1) % lightboxImages.length)}
                className="text-white hover:bg-white/10 p-3 rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </div>
          
          <div className="text-white/60 text-xs mt-4 font-semibold tracking-wider">
            Image {lightboxIdx + 1} of {lightboxImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
