import express from 'express';
import cors from 'cors';
import {
  register,
  login,
  getProfile,
  updateProfile,
  addAddress,
  googleOAuthMock,
  getAllCustomersAdmin,
  toggleCustomerStatus,
  requestEmailOTP,
  confirmEmailOTP,
  requestMobileOTP,
  confirmMobileOTP,
  forgotPasswordRequest,
  forgotPasswordVerify,
  forgotPasswordReset
} from './controllers/authController';
import { submitContactMessage, getMessagesAdmin, replyToMessageAdmin, deleteMessageAdmin, markMessageReadAdmin } from './controllers/messageController';
import { getProducts, getProductById, createProduct, deleteProduct, adjustStock, getSearchSuggestions, updateProduct, addProductReview } from './controllers/productController';
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, getAllOrdersAdmin, generateGSTInvoice, retryOrderPayment, getAdminStats, deleteOrderAdmin } from './controllers/orderController';
import { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook } from './controllers/paymentController';
import { authenticateToken, requireAdmin, optionalAuthenticate } from './middleware/auth';
import { rateLimiter, helmetSecurityHeaders, inputSanitizer } from './middleware/security';
import { uploadToCloudinary } from './controllers/uploadController';
import { uploadLocalImagesToCloudinary } from './controllers/migrationController';
import { getEmailLogs, retryEmail, testWelcomeEmail, testPasswordResetEmail, testAdminOrderEmail, testCustomerOrderEmail, testOrderShippedEmail, testOrderDeliveredEmail } from './controllers/emailController';

const app = express();

app.use(cors());
app.use(helmetSecurityHeaders);
app.use(rateLimiter);

// Capture the raw body buffer to securely verify webhook signatures with 10mb limit for base64 uploads
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(inputSanitizer);

// Base Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Kalankari API running smoothly', timestamp: new Date() });
});

// Authentication & Profile Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/google', googleOAuthMock);
app.get('/api/auth/profile', authenticateToken, getProfile);
app.put('/api/auth/profile', authenticateToken, updateProfile);
app.post('/api/auth/address', authenticateToken, addAddress);

// Profile Email/Mobile OTP Verification Routes
app.post('/api/users/profile/verify-email-request', authenticateToken, requestEmailOTP);
app.post('/api/users/profile/verify-email-confirm', authenticateToken, confirmEmailOTP);
app.post('/api/users/profile/verify-mobile-request', authenticateToken, requestMobileOTP);
app.post('/api/users/profile/verify-mobile-confirm', authenticateToken, confirmMobileOTP);

// Secure Forgot Password OTP Routes
app.post('/api/auth/forgot-password-request', forgotPasswordRequest);
app.post('/api/auth/forgot-password-verify', forgotPasswordVerify);
app.post('/api/auth/forgot-password-reset', forgotPasswordReset);

// Products Routes
app.get('/api/products', getProducts);
app.get('/api/products/search/suggestions', getSearchSuggestions);
app.get('/api/products/:id', getProductById);
app.post('/api/products', authenticateToken, requireAdmin, createProduct);
app.put('/api/products/:id', authenticateToken, requireAdmin, updateProduct);
app.delete('/api/products/:id', authenticateToken, requireAdmin, deleteProduct);
app.patch('/api/products/:id/stock', authenticateToken, requireAdmin, adjustStock);
app.post('/api/products/:id/reviews', authenticateToken, addProductReview);

// Orders Routes
app.post('/api/orders', optionalAuthenticate, createOrder);
app.get('/api/orders/my-orders', authenticateToken, getMyOrders);
app.get('/api/orders/:id/invoice', authenticateToken, generateGSTInvoice);
app.post('/api/orders/:id/retry-payment', authenticateToken, retryOrderPayment);
app.get('/api/orders/:id', optionalAuthenticate, getOrderById);
app.patch('/api/orders/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
app.get('/api/admin/orders', authenticateToken, requireAdmin, getAllOrdersAdmin);
app.delete('/api/admin/orders/:id', authenticateToken, requireAdmin, deleteOrderAdmin);
app.get('/api/admin/stats', authenticateToken, requireAdmin, getAdminStats);

// Payments Routes
app.post('/api/payments/razorpay-order', optionalAuthenticate, createRazorpayOrder);
app.post('/api/payments/verify', optionalAuthenticate, verifyRazorpayPayment);
app.post('/api/payments/webhook', razorpayWebhook);

// Support Messages Routes
app.post('/api/support/message', submitContactMessage);
app.get('/api/admin/messages', authenticateToken, requireAdmin, getMessagesAdmin);
app.post('/api/admin/messages/:id/reply', authenticateToken, requireAdmin, replyToMessageAdmin);
app.patch('/api/admin/messages/:id/read', authenticateToken, requireAdmin, markMessageReadAdmin);
app.delete('/api/admin/messages/:id', authenticateToken, requireAdmin, deleteMessageAdmin);

// Admin Customer Management Routes
app.get('/api/admin/customers', authenticateToken, requireAdmin, getAllCustomersAdmin);
app.patch('/api/admin/customers/:id/status', authenticateToken, requireAdmin, toggleCustomerStatus);
app.post('/api/admin/upload', authenticateToken, requireAdmin, uploadToCloudinary);
app.get('/api/admin/migrate-images', uploadLocalImagesToCloudinary);

// Email Logs Routes
app.get('/api/admin/email-logs', authenticateToken, requireAdmin, getEmailLogs);
app.post('/api/admin/email-logs/:id/retry', authenticateToken, requireAdmin, retryEmail);

// Email Test Routes (Public for easy Postman/curl triggers)
app.post('/api/admin/email-test/welcome', testWelcomeEmail);
app.post('/api/admin/email-test/reset', testPasswordResetEmail);
app.post('/api/admin/email-test/admin-order', testAdminOrderEmail);
app.post('/api/admin/email-test/customer-order', testCustomerOrderEmail);
app.post('/api/admin/email-test/shipped', testOrderShippedEmail);
app.post('/api/admin/email-test/delivered', testOrderDeliveredEmail);



// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
