/**
 * Centralized API Base URL Configuration
 * Fallback to localhost:5000 for local development, dynamically loads cloud endpoint in production.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
