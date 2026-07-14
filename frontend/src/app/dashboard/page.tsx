"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, LogOut, Package, Star, Calendar, MapPin, Truck, 
  LayoutDashboard, Plus, Trash2, Edit3, AlertTriangle, 
  TrendingUp, Users, ShoppingBag, ListOrdered, Check, Save, FileText, X, Mail,
  MessageSquare, Lock, Eye, EyeOff, ShieldCheck, Key, Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';

export default function Dashboard() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'stocks' | 'orders' | 'profile' | 'support'>('profile');

  // Email Logs States


  // Customer Dashboard States
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(true);
  const [myOrdersError, setMyOrdersError] = useState("");

  // Admin Dashboard States
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured'>('all');

  // Modals & UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Stock inline edit states
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  // Form states for Add/Edit Product
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    originalPrice: 0,
    description: '',
    category: 'Kurtis',
    color: 'Red',
    fabric: 'Pure Cotton',
    sleeveType: 'Three-Quarter',
    neckType: 'Round Neck',
    collectionType: 'Festive',
    stockCount: 50,
    size: [] as string[],
    images: [] as string[],
    isFeatured: false
  });

  const [imageInput, setImageInput] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result;
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: base64Data })
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setImagesList(prev => [...prev, data.url]);
            showNotification("Image uploaded to Cloudinary successfully!");
          } else {
            alert(data.error || "Failed to upload image to Cloudinary.");
          }
        } catch (err) {
          console.error("Cloudinary upload request failed:", err);
          alert("Network error during Cloudinary file upload.");
        } finally {
          setUploadingImage(false);
        }
      };
    } catch (err) {
      console.error("Local file reading failed:", err);
      alert("Failed to read local selected image.");
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (imageInput.trim()) {
      setImagesList(prev => [...prev, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const [successMsg, setSuccessMsg] = useState("");

  const isAdmin = user && (user.role === 'admin' || user.email === 'kalankari8972@gmail.com');

  // Support messages states
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");

  // Customer Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileSubmitLoading, setProfileSubmitLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: '',
    gender: '',
    dob: '',
    avatar: '',
    password: '',
    confirmPassword: ''
  });

  // Email/Mobile verification states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailVal, setNewEmailVal] = useState("");
  const [emailOtpVal, setEmailOtpVal] = useState("");
  const [emailStep, setEmailStep] = useState<'request' | 'confirm'>('request');
  const [emailModalError, setEmailModalError] = useState("");
  const [emailModalSuccess, setEmailModalSuccess] = useState("");

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobileVal, setNewMobileVal] = useState("");
  const [mobileOtpVal, setMobileOtpVal] = useState("");
  const [mobileStep, setMobileStep] = useState<'request' | 'confirm'>('request');
  const [mobileModalError, setMobileModalError] = useState("");
  const [mobileModalSuccess, setMobileModalSuccess] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (isAdmin) {
      // Admin defaults to analytics
      setActiveTab('analytics');
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch customer personal orders
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const fetchMyOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setMyOrders(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
        } else {
          setMyOrdersError(data.error || "Failed to fetch orders.");
        }
      } catch (err) {
        console.error(err);
        setMyOrdersError("Could not fetch personal order history.");
      } finally {
        setLoadingMyOrders(false);
      }
    };

    fetchMyOrders();
  }, [token, isAuthenticated]);

  // Fetch admin dashboard details
  useEffect(() => {
    if (!token || !isAdmin) return;

    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'orders') {
      fetchAdminOrders();
    } else if (activeTab === 'catalog' || activeTab === 'stocks') {
      fetchCatalogProducts();

    } else if (activeTab === 'support') {
      fetchSupportMessages();
    }
  }, [activeTab, token, isAdmin]);

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (err) {
      console.error("Fetch stats error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAdminOrders = async () => {
    setLoadingAdminOrders(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setAdminOrders(data);
    } catch (err) {
      console.error("Fetch admin orders error:", err);
    } finally {
      setLoadingAdminOrders(false);
    }
  };

  const fetchCatalogProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      if (response.ok) setProducts(data);
    } catch (err) {
      console.error("Fetch catalog error:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSupportMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSupportMessages(data);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError("Passwords do not match.");
      return;
    }

    setProfileSubmitLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileForm.name,
          gender: profileForm.gender,
          dob: profileForm.dob ? new Date(profileForm.dob).toISOString() : null,
          avatar: profileForm.avatar,
          password: profileForm.password || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        login(data, token!);
        showNotification("Profile details updated successfully!");
        setIsEditingProfile(false);
      } else {
        setProfileError(data.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setProfileError(err.message || "Network error occurred.");
    } finally {
      setProfileSubmitLoading(false);
    }
  };

  const handleEmailRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailModalError("");
    setEmailModalSuccess("");

    if (!newEmailVal.trim() || newEmailVal.trim() === user?.email) {
      setEmailModalError("Please enter a new email address.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/verify-email-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail: newEmailVal.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setEmailModalSuccess("Verification OTP has been sent to your new email.");
        setEmailStep('confirm');
      } else {
        setEmailModalError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setEmailModalError("Network error occurred.");
    }
  };

  const handleEmailConfirmOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailModalError("");
    setEmailModalSuccess("");

    if (!emailOtpVal.trim()) {
      setEmailModalError("Please enter verification OTP.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/verify-email-confirm`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: emailOtpVal.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, token!);
        setEmailModalSuccess("Email address verified and updated successfully!");
        setTimeout(() => {
          setShowEmailModal(false);
        }, 1500);
      } else {
        setEmailModalError(data.error || "Verification failed.");
      }
    } catch (err) {
      setEmailModalError("Network error occurred.");
    }
  };

  const handleMobileRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileModalError("");
    setMobileModalSuccess("");

    const cleanMobile = newMobileVal.replace(/\D/g, '');
    if (cleanMobile.length < 10 || cleanMobile === user?.phone) {
      setMobileModalError("Please enter a new 10-digit mobile number.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/verify-mobile-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newMobile: cleanMobile })
      });
      const data = await res.json();
      if (res.ok) {
        setMobileModalSuccess("Verification OTP has been sent to your new mobile number.");
        setMobileStep('confirm');
      } else {
        setMobileModalError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setMobileModalError("Network error occurred.");
    }
  };

  const handleMobileConfirmOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileModalError("");
    setMobileModalSuccess("");

    if (!mobileOtpVal.trim()) {
      setMobileModalError("Please enter verification OTP.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/verify-mobile-confirm`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: mobileOtpVal.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, token!);
        setMobileModalSuccess("Mobile number verified and updated successfully!");
        setTimeout(() => {
          setShowMobileModal(false);
        }, 1500);
      } else {
        setMobileModalError(data.error || "Verification failed.");
      }
    } catch (err) {
      setMobileModalError("Network error occurred.");
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingMessage) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${replyingMessage._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyText: replyText.trim() })
      });

      if (res.ok) {
        showNotification("Support ticket reply submitted and sent via email!");
        setReplyingMessage(null);
        setReplyText("");
        fetchSupportMessages();
      } else {
        alert("Failed to submit reply.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification("Ticket marked as read.");
        fetchSupportMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification("Support message deleted.");
        fetchSupportMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ---------------- ADMIN ACTION HANDLERS ----------------

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this product design from the catalog?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== id));
        showNotification("Design deleted successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust stock inline
  const handleSaveStock = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stockCount: editingStockVal })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p._id === id ? { ...p, stockCount: editingStockVal, availability: editingStockVal > 0 ? 'In Stock' : 'Out of Stock' } : p));
        setEditingStockId(null);
        showNotification("Stock count updated!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setAdminOrders(prev => prev.map(o => o._id === id ? updatedOrder : o));
        showNotification("Order status updated!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete order
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this order?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminOrders(prev => prev.filter(o => o._id !== id));
        showNotification("Order deleted successfully.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  // Open modals helper
  const openAddModal = () => {
    setProductForm({
      name: '',
      price: 1999,
      originalPrice: 2999,
      description: 'Handcrafted luxury digital print kurti designed with floral pattern details. Soft breathability for all-day styling.',
      category: 'Kurtis',
      color: 'Crimson',
      fabric: 'Chanderi Silk',
      sleeveType: 'Three-Quarter',
      neckType: 'V-Neck',
      collectionType: 'Premium',
      stockCount: 50,
      size: ['M', 'L', 'XL'],
      images: [],
      isFeatured: filterFeatured === 'featured'
    });
    setImagesList(['/products/file_00000000046c720795da034dd2674be1.png']);
    setImageInput('');
    setShowAddModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      description: p.description,
      category: p.category,
      color: p.color,
      fabric: p.fabric,
      sleeveType: p.sleeveType,
      neckType: p.neckType,
      collectionType: p.collectionType,
      stockCount: p.stockCount,
      size: p.size || [],
      images: p.images || [],
      isFeatured: !!p.isFeatured
    });
    setImagesList(p.images || []);
    setImageInput('');
    setShowEditModal(true);
  };

  // Submit Add Product
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = { ...productForm, images: imagesList };
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => [data, ...prev]);
        setShowAddModal(false);
        showNotification("New kurti design added successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Edit Product
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = { ...productForm, images: imagesList };
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p._id === data._id ? data : p));
        setShowEditModal(false);
        showNotification("Design details modified successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper size select
  const toggleSizeSelection = (sizeLabel: string) => {
    setProductForm(prev => {
      const sizes = prev.size.includes(sizeLabel) 
        ? prev.size.filter(s => s !== sizeLabel)
        : [...prev.size, sizeLabel];
      return { ...prev, size: sizes };
    });
  };

  // Banner feedback
  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-screen text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-5 mb-8 border-gray-150 dark:border-zinc-900 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headings text-3xl font-bold text-gray-800 dark:text-white">
            {isAdmin ? 'Admin Dashboard' : 'My Account'}
          </h1>
          {isAdmin && (
            <span className="bg-primary/10 text-primary dark:bg-zinc-800 dark:text-secondary text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full border border-primary/20">
              Admin Mode
            </span>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 border border-red-200 dark:border-red-950/40 text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 py-2 px-4 rounded text-xs font-semibold transition-colors"
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3.5 border border-green-200 dark:border-green-950/30 rounded mb-6 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Admin Tab Navigation */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2.5 border-b border-gray-100 dark:border-zinc-900 pb-4 mb-8">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'analytics' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <LayoutDashboard size={14} /> Analytics Summary
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'catalog' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <Package size={14} /> Product Catalog
          </button>
          <button 
            onClick={() => setActiveTab('stocks')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'stocks' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <AlertTriangle size={14} /> Stock Alerts
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <ListOrdered size={14} /> Order Manager
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <User size={14} /> Customer View
          </button>

          <button 
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'support' ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
          >
            <MessageSquare size={14} /> Support Messages
          </button>
        </div>
      )}

      {/* ---------------- ACTIVE TAB RENDERING ---------------- */}

      {/* TAB 1: ANALYTICS */}
      {isAdmin && activeTab === 'analytics' && (
        <div className="flex flex-col gap-8 w-full">
          
          {loadingStats ? (
            <div className="py-20 text-center text-xs text-gray-400">Loading sales summary...</div>
          ) : stats ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#121111] p-5 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Revenue</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">₹{stats.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center"><TrendingUp size={20} /></div>
                </div>

                <div className="bg-white dark:bg-[#121111] p-5 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Orders</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.ordersCount}</span>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center"><ShoppingBag size={20} /></div>
                </div>

                <div className="bg-white dark:bg-[#121111] p-5 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Catalog Designs</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.productsCount}</span>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center"><Package size={20} /></div>
                </div>

                <div className="bg-white dark:bg-[#121111] p-5 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Active Customers</span>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.customersCount}</span>
                  </div>
                  <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center"><Users size={20} /></div>
                </div>
              </div>

              {/* sales SVG Chart */}
              <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
                <h3 className="font-headings text-lg font-bold text-gray-950 dark:text-white mb-6 border-b pb-3.5">
                  Sales Growth (Last 7 Days)
                </h3>
                <div className="w-full h-80 flex flex-col justify-between">
                  {/* Custom SVG Render */}
                  <svg className="w-full h-64 overflow-visible" viewBox="0 0 700 200">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B2635" />
                        <stop offset="100%" stopColor="#B33946" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f1f1" className="dark:stroke-zinc-900" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f1f1" className="dark:stroke-zinc-900" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f1f1" className="dark:stroke-zinc-900" strokeDasharray="4 4" />
                    <line x1="0" y1="180" x2="700" y2="180" stroke="#ccc" className="dark:stroke-zinc-850" />

                    {/* Plot Bars */}
                    {stats.salesGraphData.map((d: any, idx: number) => {
                      const maxVal = Math.max(...stats.salesGraphData.map((o: any) => o.sales), 1000);
                      const height = (d.sales / maxVal) * 140;
                      const x = idx * 100 + 40;
                      const y = 180 - height;

                      return (
                        <g key={d.date} className="group cursor-pointer">
                          {/* Hover Tooltip */}
                          <rect x={x - 20} y={y - 25} width="65" height="18" rx="3" fill="#1e1e24" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <text x={x + 12} y={y - 12} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            ₹{d.sales}
                          </text>

                          {/* SVG Bar */}
                          <rect 
                            x={x} 
                            y={y} 
                            width="24" 
                            height={height} 
                            rx="4" 
                            fill="url(#barGrad)" 
                            className="hover:opacity-85 transition-opacity" 
                          />

                          {/* Label */}
                          <text x={x + 12} y="196" fill="#888" fontSize="10" fontWeight="bold" textAnchor="middle">
                            {d.date}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-gray-400">Failed to render sales analytics.</div>
          )}

        </div>
      )}

      {/* TAB 2: PRODUCT CATALOG */}
      {isAdmin && activeTab === 'catalog' && (
        <div className="flex flex-col gap-6 w-full">
          
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <h3 className="font-headings text-lg font-bold text-gray-800 dark:text-white">Active Designs</h3>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterFeatured('all')}
                  className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all ${filterFeatured === 'all' ? 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-650'}`}
                >
                  All Products
                </button>
                <button
                  type="button"
                  onClick={() => setFilterFeatured('featured')}
                  className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all ${filterFeatured === 'featured' ? 'bg-white dark:bg-zinc-950 text-yellow-600 dark:text-yellow-450 shadow-sm' : 'text-gray-400 hover:text-gray-650'}`}
                >
                  ★ Homepage Slideshow
                </button>
              </div>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Add New Design
            </button>
          </div>

          {loadingProducts ? (
            <div className="py-20 text-center text-xs text-gray-400">Loading catalog kurtis...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter(p => {
                  const isProductFeatured = p.isFeatured || (p.name === "Meera Silk Border Kurti" || p.name === "Mayur Peacock Premium Kurti" || p.name === "Aanya Mughal Motif Kurti");
                  return filterFeatured === 'all' ? true : isProductFeatured;
                })
                .map((p) => {
                  const isProductFeatured = p.isFeatured || (p.name === "Meera Silk Border Kurti" || p.name === "Mayur Peacock Premium Kurti" || p.name === "Aanya Mughal Motif Kurti");
                  return (
                    <div key={p._id} className="bg-white dark:bg-[#121111] border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
                      <div className="relative h-64 w-full bg-gray-50 flex-shrink-0">
                        <img src={p.images && p.images[0] ? p.images[0] : '/logo.jpg'} alt={p.name} className="w-full h-full object-cover" />
                        {isProductFeatured && (
                          <span className="absolute top-2.5 left-2.5 bg-yellow-500 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                            ★ Homepage Slideshow
                          </span>
                        )}
                        <span className="absolute top-2.5 right-2.5 bg-black/60 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                          {p.collectionType}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between gap-4 text-xs">
                        <div>
                          {isProductFeatured ? (
                            <span className="text-[9px] text-yellow-600 dark:text-yellow-450 font-bold bg-yellow-50 dark:bg-yellow-950/20 px-2.5 py-1 rounded inline-block mb-2 shadow-sm border border-yellow-100 dark:border-yellow-950/10">
                              ★ Featured on Hero Slider
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-medium bg-gray-50 dark:bg-zinc-900 px-2.5 py-1 rounded inline-block mb-2 border border-gray-100 dark:border-zinc-850">
                              Regular Product
                            </span>
                          )}
                      <h4 className="font-headings text-base font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold mb-2">{p.category} | {p.fabric}</p>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 border-gray-100 dark:border-zinc-900">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white text-base mr-1.5">₹{p.price}</span>
                        <span className="line-through text-[10px] text-gray-400">₹{p.originalPrice}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-2 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded text-gray-600 dark:text-gray-300"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p._id)}
                          className="p-2 border border-red-100 hover:bg-red-50 dark:border-red-950/20 dark:hover:bg-red-950/20 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: STOCK ALERTS */}
      {isAdmin && activeTab === 'stocks' && (
        <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
          <h3 className="font-headings text-lg font-bold text-gray-950 dark:text-white mb-6 border-b pb-3.5">
            Stock Monitor & Adjustments
          </h3>

          {loadingProducts ? (
            <div className="py-20 text-center text-xs text-gray-400">Loading stock tracker...</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-900 font-bold text-gray-400 uppercase text-[9px] tracking-wider pb-3">
                    <th className="pb-3">Kurti Style</th>
                    <th className="pb-3">Collection</th>
                    <th className="pb-3">Stock Count</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.stockCount <= p.lowStockThreshold;
                    return (
                      <tr key={p._id} className={`border-b border-gray-100 dark:border-zinc-900/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/20 ${isLow ? 'bg-red-50/20 dark:bg-red-950/5' : ''}`}>
                        <td className="py-3.5 flex items-center gap-3">
                          <img src={p.images && p.images[0] ? p.images[0] : '/logo.jpg'} alt={p.name} className="w-8 h-10 object-cover bg-gray-50 rounded" />
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-white block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 block">{p.fabric}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-medium text-gray-500">{p.collectionType}</td>
                        <td className="py-3.5 font-bold text-gray-800 dark:text-white">
                          {editingStockId === p._id ? (
                            <input 
                              type="number"
                              value={editingStockVal}
                              onChange={(e) => setEditingStockVal(Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 border border-primary rounded bg-transparent text-xs" 
                            />
                          ) : (
                            p.stockCount
                          )}
                        </td>
                        <td className="py-3.5">
                          {isLow ? (
                            <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 animate-pulse">
                              <AlertTriangle size={10} /> Low Stock Alert
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {editingStockId === p._id ? (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleSaveStock(p._id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingStockId(null)}
                                className="bg-gray-400 hover:bg-gray-500 text-white p-1 rounded"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingStockId(p._id);
                                setEditingStockVal(p.stockCount);
                              }}
                              className="text-primary hover:underline font-bold text-xs uppercase"
                            >
                              Edit Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 4: ORDER MANAGER */}
      {isAdmin && activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
          <h3 className="font-headings text-lg font-bold text-gray-950 dark:text-white mb-6 border-b pb-3.5">
            Global Order Pipelines
          </h3>

          {loadingAdminOrders ? (
            <div className="py-20 text-center text-xs text-gray-400">Loading order tracker...</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-900 font-bold text-gray-400 uppercase text-[9px] tracking-wider pb-3">
                    <th className="pb-3">Order Details</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items Summary</th>
                    <th className="pb-3">Billing</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Pipeline Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOrders.map((o) => (
                    <tr key={o._id} className="border-b border-gray-100 dark:border-zinc-900/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/20">
                      <td className="py-4">
                        <span className="font-bold text-gray-800 dark:text-white block">#{o._id}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-medium text-gray-850 dark:text-white block">{o.shippingAddress?.name || 'Guest'}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{o.shippingAddress?.phone}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-0.5">
                          {o.items.map((it: any, i: number) => (
                            <span key={i} className="text-gray-650 leading-tight">
                              {it.name} ({it.selectedSize}) x {it.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-gray-850 dark:text-white">₹{o.payable}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${o.paymentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        <select 
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                          className="bg-gray-50 border border-gray-250 dark:bg-zinc-900 dark:border-zinc-800 rounded py-1 px-2 text-xs focus:outline-none focus:border-primary text-gray-700 dark:text-gray-200"
                        >
                          <option value="Ordered">Ordered</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDeleteOrder(o._id)}
                          className="p-1.5 border border-red-100 hover:bg-red-50 dark:border-red-950/20 dark:hover:bg-red-950/20 rounded text-red-600 transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 4.8: SUPPORT MESSAGES */}
      {isAdmin && activeTab === 'support' && (
        <div className="flex flex-col gap-6 w-full text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-150 pb-5">
            <div>
              <h2 className="font-headings text-2xl font-bold text-gray-800">Support Inquiries</h2>
              <p className="text-xs text-gray-400 mt-1">Review contact inquiries submitted by customers, reply via email, or manage read/unread status.</p>
            </div>
            <button 
              onClick={fetchSupportMessages}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded transition-colors"
            >
              Refresh Messages
            </button>
          </div>

          {loadingMessages ? (
            <div className="py-12 text-center text-xs text-gray-400">Retrieving support inquiries...</div>
          ) : supportMessages.length === 0 ? (
            <div className="bg-white border border-gray-150 p-12 rounded-lg text-center text-xs text-gray-400">
              No support inquiries registered in the database.
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-55/70 border-b border-gray-150 font-bold text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Message</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supportMessages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-gray-50/50">
                        <td className="p-4 align-top">
                          <div className="font-semibold text-gray-800">{msg.name}</div>
                          <div className="text-gray-400 mt-0.5">{msg.email}</div>
                          {msg.phone && <div className="text-gray-400 mt-0.5">{msg.phone}</div>}
                        </td>
                        <td className="p-4 align-top max-w-sm">
                          <div className="font-semibold text-gray-700">Subject: {msg.subject}</div>
                          <div className="text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                          {msg.replies && msg.replies.length > 0 && (
                            <div className="mt-3.5 bg-gray-50 border border-gray-200 p-2.5 rounded text-[11px]">
                              <strong className="text-primary uppercase text-[9px] tracking-wider block mb-1">Admin Reply:</strong>
                              {msg.replies.map((reply: string, i: number) => (
                                <p key={i} className="text-gray-600">{reply}</p>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-top text-gray-400">
                          {new Date(msg.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4 align-top">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            msg.status === 'completed' 
                              ? 'bg-green-50 text-green-600' 
                              : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {msg.status === 'completed' ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td className="p-4 align-top text-right space-y-1.5">
                          <div className="flex flex-col sm:flex-row gap-1.5 justify-end">
                            {msg.status !== 'completed' && (
                              <button 
                                onClick={() => handleMarkRead(msg._id)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-750 px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Mark Read
                              </button>
                            )}
                            <button 
                              onClick={() => setReplyingMessage(msg)}
                              className="bg-primary hover:bg-primary-hover text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Reply via Email
                            </button>
                            <button 
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="bg-red-55 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {replyingMessage && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-lg shadow-2xl relative text-left">
            <button 
              onClick={() => setReplyingMessage(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-primary"
            >
              <X size={18} />
            </button>
            <h3 className="font-headings font-bold text-lg text-gray-900 mb-4">Reply to Support Ticket</h3>
            
            <div className="mb-4 bg-gray-50 p-3 rounded text-xs border">
              <p className="text-gray-400"><strong>To:</strong> {replyingMessage.name} ({replyingMessage.email})</p>
              <p className="text-gray-450 mt-1"><strong>Query:</strong> {replyingMessage.message}</p>
            </div>

            <form onSubmit={handleReplySubmit} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Reply Email Content</label>
                <textarea 
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  className="py-2.5 px-4 border border-gray-250 rounded focus:outline-none focus:border-primary resize-none text-xs"
                />
              </div>
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover text-white py-2.5 rounded font-bold uppercase tracking-wider text-xs shadow"
              >
                Send Email Reply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER VIEW (PERSONAL ACCOUNT PANEL) */}
      {(!isAdmin || activeTab === 'profile') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Profile details */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {isEditingProfile ? (
              <div className="bg-white p-6 border border-gray-150 rounded-lg shadow-sm text-left">
                <h3 className="font-headings text-lg font-bold text-gray-900 border-b pb-3 mb-5">
                  Edit Profile Details
                </h3>
                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4 text-xs text-gray-700">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="py-2 px-3 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Gender</label>
                    <select 
                      value={profileForm.gender} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="py-2 px-3 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="date" 
                      value={profileForm.dob} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, dob: e.target.value }))}
                      className="py-2 px-3 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs w-full" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Profile Photo URL</label>
                    <input 
                      type="text" 
                      value={profileForm.avatar} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://example.com/avatar.jpg"
                      className="py-2 px-3 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input 
                        type={showProfilePassword ? "text" : "password"} 
                        value={profileForm.password} 
                        onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Leave blank to keep current password"
                        className="w-full py-2.5 pl-4 pr-10 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                      >
                        {showProfilePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={profileForm.confirmPassword} 
                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Verify new password"
                      className="py-2 px-3 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                    />
                  </div>

                  {profileError && (
                    <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                      {profileError}
                    </p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button 
                      type="submit" 
                      disabled={profileSubmitLoading}
                      className="bg-primary hover:bg-primary-hover text-white py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex-1"
                    >
                      {profileSubmitLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white p-6 border border-gray-150 rounded-lg shadow-sm text-left">
                <div className="flex items-center gap-4 border-b pb-5 mb-5 border-gray-50">
                  <div className="w-14 h-14 bg-primary/5 text-primary rounded-full flex items-center justify-center font-bold text-xl overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-gray-800 leading-tight">{user?.name}</h3>
                    <span className="text-[10px] text-gray-400 capitalize">{user?.role} Profile</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5 text-xs text-gray-655">
                  <p className="flex justify-between border-b pb-2"><span className="text-gray-400">Email:</span> <span className="font-medium">{user?.email}</span></p>
                  <p className="flex justify-between border-b pb-2"><span className="text-gray-400">Contact No:</span> <span className="font-medium">{user?.phone || 'Not set'}</span></p>
                  <p className="flex justify-between border-b pb-2"><span className="text-gray-400">Date of Birth:</span> <span className="font-medium">{user?.dob ? new Date(user.dob).toLocaleDateString('en-IN') : 'Not set'}</span></p>
                  <p className="flex justify-between pb-1"><span className="text-gray-400">Gender:</span> <span className="font-medium capitalize">{user?.gender || 'Not set'}</span></p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setProfileForm({
                        name: user?.name || '',
                        gender: user?.gender || '',
                        dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                        avatar: user?.avatar || '',
                        password: '',
                        confirmPassword: ''
                      });
                      setIsEditingProfile(true);
                    }}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow"
                  >
                    Edit Profile Details
                  </button>
                  <button 
                    onClick={() => {
                      setNewEmailVal(user?.email || '');
                      setEmailStep('request');
                      setEmailOtpVal('');
                      setEmailModalError('');
                      setEmailModalSuccess('');
                      setShowEmailModal(true);
                    }}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    Change Email Address
                  </button>
                  <button 
                    onClick={() => {
                      setNewMobileVal(user?.phone || '');
                      setMobileStep('request');
                      setMobileOtpVal('');
                      setMobileModalError('');
                      setMobileModalSuccess('');
                      setShowMobileModal(true);
                    }}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    Change Mobile Number
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Orders list */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#121111] p-6 border border-gray-150 dark:border-zinc-900 rounded-lg shadow-sm text-left">
              <h3 className="font-headings text-lg font-bold text-gray-900 dark:text-white border-b pb-3 mb-6">
                My Kurti Orders
              </h3>

              {loadingMyOrders ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading order history...</div>
              ) : myOrdersError ? (
                <p className="text-xs text-red-500 font-semibold">{myOrdersError}</p>
              ) : myOrders.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                  <Package size={48} className="text-gray-300" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">No Orders Placed Yet</h4>
                  <p className="text-[10px] text-gray-400">You haven&apos;t placed any orders yet. Once you order, they will appear here.</p>
                  <Link href="/shop" className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2.5 rounded shadow mt-2">
                    Browse Shop
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {myOrders.map((o) => (
                    <div key={o._id} className="border border-gray-100 dark:border-zinc-900 rounded-lg p-5 flex flex-col gap-4 text-xs relative">
                      <div className="flex flex-wrap justify-between items-center border-b pb-3 border-gray-50 dark:border-zinc-900/50 gap-2">
                        <div>
                          <span className="font-bold text-gray-800 dark:text-white">Order Reference: #{o._id}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">Date: {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${o.paymentStatus === 'Completed' ? 'bg-green-50 text-green-600 dark:bg-green-950/30' : 'bg-yellow-50 text-yellow-600'}`}>
                            {o.paymentStatus
                          }</span>
                          
                          {/* Invoice Printing */}
                          {o.paymentStatus === 'Completed' && (
                            <a 
                              href={`${API_BASE_URL}/api/orders/${o._id}/invoice?token=${token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  fetch(`${API_BASE_URL}/api/orders/${o._id}/invoice`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  .then(res => res.text())
                                  .then(html => {
                                    printWindow.document.write(html);
                                    printWindow.document.close();
                                  });
                                }
                              }}
                              className="text-[9px] uppercase font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} /> Invoice
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-3">
                        {o.items.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-gray-850 dark:text-white block">{it.name}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">Size: {it.selectedSize} | Qty: {it.quantity}</span>
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-white">₹{(it.price * it.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between border-t border-gray-50 dark:border-zinc-900/50 pt-3 items-center">
                        <div>
                          <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Estimated Delivery Status</span>
                          <span className="text-gray-700 dark:text-gray-300 font-bold block mt-0.5 uppercase tracking-wide text-[10px] text-primary">{o.status}</span>
                        </div>
                        <span className="font-bold text-gray-855 dark:text-white text-sm">Billed Total: ₹{o.payable.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ---------------- MODAL 1: ADD PRODUCT ---------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121111] max-w-xl w-full rounded-lg shadow-xl border border-gray-200 dark:border-zinc-900 text-left p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-5 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex justify-between items-center border-b pb-3 mb-2 border-gray-50 dark:border-zinc-900">
              <h3 className="font-headings text-lg font-bold text-gray-900 dark:text-white">Add New Design</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-655"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={productForm.name} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sale Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.price} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Original Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.originalPrice} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={productForm.description} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Kurtis">Kurtis</option>
                    <option value="Kurtas">Kurtas</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Fabric</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.fabric} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, fabric: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Color</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.color} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sleeve Type</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.sleeveType} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, sleeveType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Neck Type</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.neckType} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, neckType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Collection Group</label>
                  <select 
                    value={productForm.collectionType}
                    onChange={(e) => setProductForm(prev => ({ ...prev, collectionType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Festive">Festive</option>
                    <option value="Floral">Floral</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.stockCount} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockCount: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sizes Available</label>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                    const isSelected = productForm.size.includes(sz);
                    return (
                      <button 
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeSelection(sz)}
                        className={`w-10 h-10 border rounded text-xs font-bold transition-all ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-205 dark:border-zinc-800'}`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1.5">
                <input 
                  type="checkbox" 
                  id="isFeaturedAdd" 
                  checked={productForm.isFeatured} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                />
                <label htmlFor="isFeaturedAdd" className="font-bold text-[10px] text-gray-750 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none">
                  Featured Product (Show on Homepage)
                </label>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Product Images / Views ({imagesList.length})</label>
                
                {/* Images Grid */}
                {imagesList.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-zinc-900/40 p-3 rounded border border-gray-150 dark:border-zinc-900">
                    {imagesList.map((url, idx) => (
                      <div key={idx} className="aspect-square relative group rounded border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-black">
                        <img src={url} alt={`View ${idx+1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 font-bold text-xs"
                          title="Remove view"
                        >
                          Delete
                        </button>
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] px-1 rounded font-semibold">#{idx+1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL Input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste another view photo URL..."
                    value={imageInput} 
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-grow py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                  <button 
                    type="button" 
                    onClick={handleAddImageUrl}
                    className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 text-xs font-bold rounded transition-colors"
                  >
                    Add URL
                  </button>
                </div>
                
                {/* Cloudinary Upload Trigger */}
                <div className="relative border border-dashed border-gray-205 dark:border-zinc-850 rounded p-4 text-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <span className="text-[11px] text-gray-400 font-semibold animate-pulse">
                      Uploading to Cloudinary...
                    </span>
                  ) : (
                    <span className="text-[11px] text-primary font-bold hover:underline">
                      + Upload another view from computer
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white py-3.5 font-bold uppercase tracking-wider text-xs rounded mt-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Register Kurti Design
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: EDIT PRODUCT ---------------- */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121111] max-w-xl w-full rounded-lg shadow-xl border border-gray-200 dark:border-zinc-900 text-left p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-5 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex justify-between items-center border-b pb-3 mb-2 border-gray-50 dark:border-zinc-900">
              <h3 className="font-headings text-lg font-bold text-gray-900 dark:text-white">Edit Design Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-655"><X size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={productForm.name} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sale Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.price} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Original Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.originalPrice} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={productForm.description} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs resize-none" 
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Kurtis">Kurtis</option>
                    <option value="Kurtas">Kurtas</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Fabric</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.fabric} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, fabric: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Color</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.color} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sleeve Type</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.sleeveType} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, sleeveType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Neck Type</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.neckType} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, neckType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Collection Group</label>
                  <select 
                    value={productForm.collectionType}
                    onChange={(e) => setProductForm(prev => ({ ...prev, collectionType: e.target.value }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Festive">Festive</option>
                    <option value="Floral">Floral</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Stock Count</label>
                  <input 
                    type="number" 
                    required
                    value={productForm.stockCount} 
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockCount: Number(e.target.value) }))}
                    className="py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Sizes Available</label>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => {
                    const isSelected = productForm.size.includes(sz);
                    return (
                      <button 
                        key={sz}
                        type="button"
                        onClick={() => toggleSizeSelection(sz)}
                        className={`w-10 h-10 border rounded text-xs font-bold transition-all ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-205 dark:border-zinc-800'}`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1.5">
                <input 
                  type="checkbox" 
                  id="isFeaturedEdit" 
                  checked={productForm.isFeatured} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-zinc-800 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                />
                <label htmlFor="isFeaturedEdit" className="font-bold text-[10px] text-gray-750 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none">
                  Featured Product (Show on Homepage)
                </label>
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Product Images / Views ({imagesList.length})</label>
                
                {/* Images Grid */}
                {imagesList.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 bg-gray-50 dark:bg-zinc-900/40 p-3 rounded border border-gray-150 dark:border-zinc-900">
                    {imagesList.map((url, idx) => (
                      <div key={idx} className="aspect-square relative group rounded border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-black">
                        <img src={url} alt={`View ${idx+1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 font-bold text-xs"
                          title="Remove view"
                        >
                          Delete
                        </button>
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] px-1 rounded font-semibold">#{idx+1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL Input */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste another view photo URL..."
                    value={imageInput} 
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-grow py-2 px-3 border border-gray-250 dark:border-zinc-850 rounded bg-transparent dark:text-gray-100 focus:outline-none focus:border-primary text-xs" 
                  />
                  <button 
                    type="button" 
                    onClick={handleAddImageUrl}
                    className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 text-xs font-bold rounded transition-colors"
                  >
                    Add URL
                  </button>
                </div>
                
                {/* Cloudinary Upload Trigger */}
                <div className="relative border border-dashed border-gray-205 dark:border-zinc-850 rounded p-4 text-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <span className="text-[11px] text-gray-400 font-semibold animate-pulse">
                      Uploading to Cloudinary...
                    </span>
                  ) : (
                    <span className="text-[11px] text-primary font-bold hover:underline">
                      + Upload another view from computer
                    </span>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white py-3.5 font-bold uppercase tracking-wider text-xs rounded mt-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> Save Design Modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 sm:p-8 rounded-lg shadow-2xl relative text-left">
            <button 
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-primary transition-colors text-lg"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h3 className="font-headings font-bold text-lg text-gray-900 flex items-center gap-1.5"><Mail className="text-primary" size={18} /> Change Email Address</h3>
              <p className="text-xs text-gray-400 mt-1">Changing your registered email address requires OTP verification.</p>
            </div>

            {emailStep === 'request' ? (
              <form onSubmit={handleEmailRequestOTP} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">New Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={newEmailVal}
                    onChange={(e) => setNewEmailVal(e.target.value)}
                    placeholder="newemail@example.com"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                  />
                </div>

                {emailModalError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {emailModalError}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  Send Verification OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailConfirmOTP} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="bg-gray-50 border p-3 rounded text-[11px] mb-1">
                  Verifying change to: <strong>{newEmailVal}</strong>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">6-Digit Verification OTP</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    value={emailOtpVal}
                    onChange={(e) => setEmailOtpVal(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-center font-bold tracking-widest text-sm" 
                  />
                </div>

                {emailModalError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {emailModalError}
                  </p>
                )}

                {emailModalSuccess && (
                  <p className="text-green-700 bg-green-50 border border-green-200 p-2.5 rounded font-semibold text-xs">
                    {emailModalSuccess}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  Verify & Update Email
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile Change Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 sm:p-8 rounded-lg shadow-2xl relative text-left">
            <button 
              onClick={() => setShowMobileModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-primary transition-colors text-lg"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h3 className="font-headings font-bold text-lg text-gray-900 flex items-center gap-1.5"><Phone className="text-primary" size={18} /> Change Mobile Number</h3>
              <p className="text-xs text-gray-400 mt-1">Changing your registered contact number requires OTP verification.</p>
            </div>

            {mobileStep === 'request' ? (
              <form onSubmit={handleMobileRequestOTP} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">New 10-Digit Mobile Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={newMobileVal}
                    onChange={(e) => setNewMobileVal(e.target.value)}
                    placeholder="9876543210"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                  />
                </div>

                {mobileModalError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {mobileModalError}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  Send Verification OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleMobileConfirmOTP} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="bg-gray-50 border p-3 rounded text-[11px] mb-1">
                  Verifying change to: <strong>{newMobileVal}</strong>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">6-Digit Verification OTP</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    value={mobileOtpVal}
                    onChange={(e) => setMobileOtpVal(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-center font-bold tracking-widest text-sm" 
                  />
                </div>

                {mobileModalError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {mobileModalError}
                  </p>
                )}

                {mobileModalSuccess && (
                  <p className="text-green-700 bg-green-50 border border-green-200 p-2.5 rounded font-semibold text-xs">
                    {mobileModalSuccess}
                  </p>
                )}

                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  Verify & Update Mobile
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
