import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import HomepageReview from '../models/HomepageReview';
import { AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/emailService';

// Helper: Recalculate average rating & reviewsCount on Product
export const updateProductRatingStats = async (productId: string) => {
  const approvedReviews = await Review.find({ productId, status: 'Approved' });
  if (approvedReviews.length === 0) {
    await Product.findByIdAndUpdate(productId, { rating: 0, reviewsCount: 0 });
    return;
  }

  const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Number((totalRating / approvedReviews.length).toFixed(1));
  await Product.findByIdAndUpdate(productId, { rating: avgRating, reviewsCount: approvedReviews.length });
};

// 1. GET /api/products/:id/reviews (Public reviews list with aggregates & pagination)
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const { sortBy = 'newest', page = 1, limit = 5 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    // Build sort mapping
    let sortObj: any = { createdAt: -1 };
    if (sortBy === 'oldest') sortObj = { createdAt: 1 };
    else if (sortBy === 'highest') sortObj = { rating: -1 };
    else if (sortBy === 'lowest') sortObj = { rating: 1 };

    // Fetch approved reviews
    const reviews = await Review.find({ productId, status: 'Approved' })
      .populate('userId', 'name avatar')
      .sort(sortObj)
      .skip(skipNum)
      .limit(limitNum);

    const totalApproved = await Review.countDocuments({ productId, status: 'Approved' });

    // Aggregate rating distributions
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const allApproved = await Review.find({ productId, status: 'Approved' }).select('rating');
    allApproved.forEach(r => {
      const rt = r.rating as 1 | 2 | 3 | 4 | 5;
      if (distribution[rt] !== undefined) {
        distribution[rt]++;
      }
    });

    const averageRating = allApproved.length > 0
      ? Number((allApproved.reduce((sum, r) => sum + r.rating, 0) / allApproved.length).toFixed(1))
      : 0;

    res.json({
      reviews,
      totalReviews: totalApproved,
      averageRating,
      distribution,
      totalPages: Math.ceil(totalApproved / limitNum),
      currentPage: pageNum
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 2. POST /api/products/:id/reviews (Customer review submission)
export const submitProductReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const productId = req.params.id;
    const userId = req.user.id;
    const { rating, title, review, images } = req.body;

    if (!rating || !review) {
      return res.status(400).json({ error: 'Rating and review description are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Fetch user orders that are Delivered
    const userOrders = await Order.find({
      user: userId,
      status: 'Delivered'
    });

    // Check if any order contains the product (by ID or by name fallback)
    const eligibleOrder = userOrders.find(o => 
      o.items.some(it => 
        (it.product && it.product.toString() === productId) ||
        (it.name && it.name.trim().toLowerCase() === product.name.trim().toLowerCase())
      )
    );

    if (!eligibleOrder) {
      return res.status(403).json({ error: 'Only customers who have received this product (delivered orders) can write a review.' });
    }

    // Verify only 1 review per product per customer
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product. You can edit your existing review instead.' });
    }

    const newReview = new Review({
      userId,
      productId,
      orderId: eligibleOrder._id,
      rating,
      title: title || '',
      review,
      images: images || [],
      status: 'Pending',
      featured: false
    });

    await newReview.save();

    // Trigger Admin email alert
    const user = await User.findById(userId);
    if (user) {
      EmailService.sendReviewSubmittedNotification(newReview, product, user);
    }

    res.status(201).json({ message: 'Review submitted successfully. It will appear on the site once approved by moderators.', review: newReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 3. PUT /api/reviews/:id (Customer edit their own review)
export const editProductReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { rating, title, review, images } = req.body;
    const reviewId = req.params.id;
    const userId = req.user.id;

    const dbReview = await Review.findById(reviewId);
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    // Authenticate owner
    if (dbReview.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied: You can only edit your own reviews.' });
    }

    const wasApproved = dbReview.status === 'Approved';

    dbReview.rating = rating || dbReview.rating;
    dbReview.title = title !== undefined ? title : dbReview.title;
    dbReview.review = review || dbReview.review;
    dbReview.images = images || dbReview.images;
    dbReview.status = 'Pending'; // reset for re-approval

    await dbReview.save();

    // If it was approved, recalculate stats since it is now pending moderation
    if (wasApproved) {
      await updateProductRatingStats(dbReview.productId.toString());
    }

    res.json({ message: 'Review updated successfully and resubmitted for moderation.', review: dbReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 4. DELETE /api/reviews/:id (Customer delete their own review; Admin can delete any)
export const deleteProductReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const reviewId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const dbReview = await Review.findById(reviewId);
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    if (dbReview.userId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You cannot delete this review.' });
    }

    const productId = dbReview.productId.toString();
    const wasApproved = dbReview.status === 'Approved';

    await Review.findByIdAndDelete(reviewId);

    // Clean up homepage review mapping if linked
    await HomepageReview.deleteOne({ reviewId });

    if (wasApproved) {
      await updateProductRatingStats(productId);
    }

    res.json({ message: 'Review deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 5. GET /api/admin/reviews (Admin moderation query)
export const getAllReviewsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status, featured, search, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const query: any = {};
    if (status) query.status = status;
    if (featured !== undefined) query.featured = featured === 'true';

    // Search by review title or text
    if (search) {
      query.$or = [
        { title: new RegExp(String(search), 'i') },
        { review: new RegExp(String(search), 'i') }
      ];
    }

    const reviews = await Review.find(query)
      .populate('userId', 'name email phone')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 6. PATCH /api/admin/reviews/:id/status (Admin set review status & notify customer)
export const updateReviewStatusAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const reviewId = req.params.id;

    if (!['Approved', 'Rejected', 'Hidden', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const dbReview = await Review.findById(reviewId);
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    const oldStatus = dbReview.status;
    dbReview.status = status;
    await dbReview.save();

    // Update aggregate stats
    await updateProductRatingStats(dbReview.productId.toString());

    // If status became Approved, send email verification alert to customer
    if (status === 'Approved' && oldStatus !== 'Approved') {
      const user = await User.findById(dbReview.userId);
      const product = await Product.findById(dbReview.productId);
      if (user && product) {
        EmailService.sendReviewApprovedNotification(dbReview, product, user);
      }
    }

    res.json({ message: `Review status updated to ${status} successfully.`, review: dbReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 7. PATCH /api/admin/reviews/:id/feature (Admin feature reviews)
export const toggleReviewFeatureAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { featured } = req.body;
    const reviewId = req.params.id;

    const dbReview = await Review.findByIdAndUpdate(reviewId, { featured }, { new: true });
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    res.json({ message: `Review featured status set to ${featured}.`, review: dbReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 8. PUT /api/admin/reviews/:id (Admin edit review details)
export const editReviewAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, title, review, images } = req.body;
    const reviewId = req.params.id;

    const dbReview = await Review.findById(reviewId);
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    dbReview.rating = rating !== undefined ? rating : dbReview.rating;
    dbReview.title = title !== undefined ? title : dbReview.title;
    dbReview.review = review !== undefined ? review : dbReview.review;
    dbReview.images = images !== undefined ? images : dbReview.images;

    await dbReview.save();

    if (dbReview.status === 'Approved') {
      await updateProductRatingStats(dbReview.productId.toString());
    }

    res.json({ message: 'Review edited by administrator successfully.', review: dbReview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 9. DELETE /api/admin/reviews/:id (Admin delete review)
export const deleteReviewAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = req.params.id;
    const dbReview = await Review.findById(reviewId);
    if (!dbReview) return res.status(404).json({ error: 'Review not found.' });

    const productId = dbReview.productId.toString();
    const wasApproved = dbReview.status === 'Approved';

    await Review.findByIdAndDelete(reviewId);
    await HomepageReview.deleteOne({ reviewId });

    if (wasApproved) {
      await updateProductRatingStats(productId);
    }

    res.json({ message: 'Review deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 10. GET /api/homepage-reviews (Public fetch pinned homepage reviews)
export const getHomepageReviews = async (req: Request, res: Response) => {
  try {
    const hr = await HomepageReview.find({ enabled: true })
      .populate({
        path: 'reviewId',
        populate: [
          { path: 'userId', select: 'name avatar' },
          { path: 'productId', select: 'name images' }
        ]
      })
      .sort({ pinned: -1, order: 1 });

    // Clean up null references (e.g. if reviews were deleted but mapping remained)
    const validHr = hr.filter(item => item.reviewId !== null && (item.reviewId as any).status === 'Approved');

    res.json(validHr.map(item => ({
      _id: item._id,
      order: item.order,
      pinned: item.pinned,
      review: item.reviewId
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 11. GET /api/admin/homepage-reviews (Admin fetch curators list)
export const getHomepageReviewsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const list = await HomepageReview.find()
      .populate({
        path: 'reviewId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'productId', select: 'name images' }
        ]
      })
      .sort({ order: 1 });

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 12. PUT /api/admin/homepage-reviews (Admin updates curation configuration)
export const updateHomepageReviewsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { reviewId: string, order: number, pinned: boolean, enabled: boolean }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Payload must be an items array.' });
    }

    // Clean up current mappings
    await HomepageReview.deleteMany({});

    const bulkDocs = items.map((item, index) => ({
      reviewId: new mongoose.Types.ObjectId(item.reviewId),
      order: item.order !== undefined ? item.order : index,
      pinned: item.pinned || false,
      enabled: item.enabled !== undefined ? item.enabled : true
    }));

    if (bulkDocs.length > 0) {
      await HomepageReview.insertMany(bulkDocs);
    }

    res.json({ message: 'Homepage Curation lists saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 13. GET /api/reviews/my-review (Fetch logged in user's review for a product)
export const getMyReviewForProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ error: 'productId query param is required.' });
    }
    const review = await Review.findOne({ userId: req.user.id, productId });
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
