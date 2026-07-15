"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, LogIn, UserPlus, Eye, EyeOff, X, Key, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';

function AuthContent() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Toggle tab
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Input states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '' });
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus('submitting');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        login(data.user, data.token);
        router.push(redirectPath);
      } else {
        setErrorMsg(data.error || "Login failed. Verify credentials.");
        setStatus('idle');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg("Connection failed. Make sure your backend API server is running.");
      setStatus('idle');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus('submitting');

    // Simple 10 digit check
    const cleanPhone = registerData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      setStatus('idle');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registerData,
          phone: cleanPhone
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          login(data.user, data.token);
          router.push(redirectPath);
        } else {
          setStatus('success');
          setActiveTab('login');
          setLoginData({ email: registerData.email, password: '' });
          setErrorMsg("Account created successfully! Please log in.");
          setRegisterData({ name: '', email: '', phone: '', password: '' });
          setStatus('idle');
        }
      } else {
        setErrorMsg(data.error || "Registration failed. Try again.");
        setStatus('idle');
      }
    } catch (err) {
      console.error('Register error:', err);
      setErrorMsg("Connection failed. Make sure your backend API server is running.");
      setStatus('idle');
    }
  };

  // Trigger password reset OTP
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim()) {
      setForgotError("Email address is required.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger OTP.");
      }

      setForgotSuccess("A 6-digit OTP code has been sent to your email.");
      setForgotStep('otp');
    } catch (err: any) {
      setForgotError(err.message || "An error occurred.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Verify OTP only
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotOTP.trim()) {
      setForgotError("Please enter the 6-digit OTP code.");
      return;
    }

    setForgotLoading(true);
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/auth/forgot-password-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: forgotOTP.trim() })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid OTP code.");
      }

      setForgotSuccess("OTP verified successfully! Please choose a new password.");
      setForgotStep('password');
    } catch (err: any) {
      setForgotError(err.message || "An error occurred.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Reset password after successful verification
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (forgotPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const resetRes = await fetch(`${API_BASE_URL}/api/auth/forgot-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOTP.trim(),
          password: forgotPassword
        })
      });
      const resetData = await resetRes.json();

      if (!resetRes.ok) {
        throw new Error(resetData.error || "Password reset failed.");
      }

      setForgotSuccess("Password updated successfully! Redirecting...");
      setTimeout(() => {
        setForgotOpen(false);
        setActiveTab('login');
        setLoginData({ email: forgotEmail, password: '' });
        setErrorMsg("Password updated successfully! Please log in.");
        
        // Reset modal state
        setForgotEmail("");
        setForgotOTP("");
        setForgotPassword("");
        setForgotConfirm("");
        setForgotStep('email');
      }, 2000);
    } catch (err: any) {
      setForgotError(err.message || "An error occurred.");
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(loginData.email);
    setForgotStep('email');
    setForgotOTP("");
    setForgotPassword("");
    setForgotConfirm("");
    setForgotError(null);
    setForgotSuccess(null);
    setForgotOpen(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 min-h-[80vh] flex flex-col justify-center w-full text-left mt-10">
      <div className="bg-white border border-gray-150 rounded-lg shadow-sm overflow-hidden p-8 flex flex-col gap-6">
        
        {/* Toggle Headings */}
        <div className="flex border-b border-gray-100 font-bold text-xs uppercase tracking-wider justify-around">
          <button 
            onClick={() => { setActiveTab('login'); setErrorMsg(""); }}
            className={`pb-3.5 flex items-center gap-1.5 transition-all ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LogIn size={14} /> Log In
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setErrorMsg(""); }}
            className={`pb-3.5 flex items-center gap-1.5 transition-all ${activeTab === 'register' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <UserPlus size={14} /> Sign Up
          </button>
        </div>

        {/* Dynamic Forms */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 text-xs text-gray-700">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Mail size={12} /> Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="you@example.com"
                className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Lock size={12} /> Password</label>
                <button 
                  type="button" 
                  onClick={openForgotModal}
                  className="text-[10px] text-primary font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-4 pr-10 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                />
                <button 
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className={`p-2.5 rounded font-semibold text-xs border ${errorMsg.includes("successfully") ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-500 bg-red-50/50 border-red-100'}`}>
                {errorMsg}
              </p>
            )}

            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white text-center py-3.5 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow mt-2 flex items-center justify-center gap-1.5"
            >
              {status === 'submitting' ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center mt-3 text-xs text-gray-500">
              Don't have an Account?{' '}
              <button 
                type="button" 
                onClick={() => { setActiveTab('register'); setErrorMsg(""); }}
                className="text-primary hover:underline font-bold"
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-xs text-gray-700">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><User size={12} /> Full Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Siddharth Patel"
                className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Mail size={12} /> Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="siddharth@gmail.com"
                className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Phone size={12} /> Phone Number</label>
              <input 
                type="tel" 
                name="phone" 
                required 
                value={registerData.phone}
                onChange={handleRegisterChange}
                placeholder="9876543210"
                className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Lock size={12} /> Password</label>
              <div className="relative">
                <input 
                  type={showRegisterPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Choose password"
                  className="w-full py-2.5 pl-4 pr-10 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                />
                <button 
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                {errorMsg}
              </p>
            )}

            <button 
              type="submit" 
              disabled={status === 'submitting'}
              className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white text-center py-3.5 text-xs font-bold uppercase tracking-widest transition-colors rounded shadow mt-2 flex items-center justify-center gap-1.5"
            >
              {status === 'submitting' ? 'Creating Account...' : 'Register Now'}
            </button>

            <div className="text-center mt-3 text-xs text-gray-500">
              Already have an Account?{' '}
              <button 
                type="button" 
                onClick={() => { setActiveTab('login'); setErrorMsg(""); }}
                className="text-primary hover:underline font-bold"
              >
                Log In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Forgot Password Overlay Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 max-w-sm w-full p-6 sm:p-8 rounded-lg shadow-2xl relative text-left">
            <button 
              onClick={() => setForgotOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-primary transition-colors text-lg"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h3 className="font-headings font-bold text-xl text-gray-900 flex items-center gap-1.5"><Key className="text-primary" size={20} /> Forgot Password</h3>
              <p className="text-xs text-gray-400 mt-1">Reset your login password using a secure 6-digit OTP code.</p>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={handleForgotRequest} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Registered Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                  />
                </div>

                {forgotError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {forgotError}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? 'Requesting OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : forgotStep === 'otp' ? (
              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">6-Digit Verification OTP</label>
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    value={forgotOTP}
                    onChange={(e) => setForgotOTP(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-center font-bold tracking-widest text-sm" 
                  />
                </div>

                {forgotError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {forgotError}
                  </p>
                )}

                {forgotSuccess && (
                  <p className="text-green-700 bg-green-50 border border-green-200 p-2.5 rounded font-semibold text-xs">
                    {forgotSuccess}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-xs text-gray-700">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Create New Password</label>
                  <div className="relative">
                    <input 
                      type={showForgotNewPassword ? "text" : "password"} 
                      required 
                      value={forgotPassword}
                      onChange={(e) => setForgotPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full py-2.5 pl-4 pr-10 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={forgotConfirm}
                    onChange={(e) => setForgotConfirm(e.target.value)}
                    placeholder="Verify password"
                    className="py-2.5 px-4 border border-gray-250 rounded bg-transparent focus:outline-none focus:border-primary text-xs" 
                  />
                </div>

                {forgotError && (
                  <p className="text-red-500 font-semibold bg-red-50 p-2.5 rounded border border-red-100 text-xs">
                    {forgotError}
                  </p>
                )}

                {forgotSuccess && (
                  <p className="text-green-700 bg-green-50 border border-green-200 p-2.5 rounded font-semibold text-xs">
                    {forgotSuccess}
                  </p>
                )}

                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="bg-primary hover:bg-primary-hover disabled:bg-zinc-400 text-white py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
