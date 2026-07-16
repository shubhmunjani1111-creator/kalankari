import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import Review from '../models/Review';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, fabric, color, size, maxPrice, search, isBestSeller, isNewArrival, sort } = req.query;
    
    let query: any = {};

    if (category) query.category = category;
    if (fabric) query.fabric = fabric;
    if (color) query.color = color;
    if (size) query.size = { $in: [size] };
    if (maxPrice) query.price = { $lte: Number(maxPrice) };
    if (isBestSeller) query.isBestSeller = isBestSeller === 'true';
    if (isNewArrival) query.isNewArrival = isNewArrival === 'true';
    
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      const conditions: any[] = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { fabric: searchRegex },
        { color: searchRegex }
      ];
      if (mongoose.Types.ObjectId.isValid(String(search))) {
        conditions.push({ _id: search });
      }
      query.$or = conditions;
    }

    let sortOption: any = {};
    if (sort === 'price-low') {
      sortOption.price = 1;
    } else if (sort === 'price-high') {
      sortOption.price = -1;
    } else if (sort === 'newest') {
      sortOption.createdAt = -1;
    } else {
      sortOption.isBestSeller = -1;
    }

    const products = await Product.find(query).sort(sortOption);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.id;
    let product;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ 'seo.slug': idOrSlug });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern['seo.slug']) {
      return res.status(400).json({ error: 'URL Slug must be unique. This slug is already in use.' });
    }
    res.status(400).json({ error: err.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { stockCount } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stockCount }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern['seo.slug']) {
      return res.status(400).json({ error: 'URL Slug must be unique. This slug is already in use.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// V2.1: Verified purchases reviews controller logic
export const submitReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { productId, rating, title, desc, photos } = req.body;

    // Strict validation: Verify customer purchased and received the product
    const order = await Order.findOne({
      user: req.user.id,
      status: 'Delivered',
      'items.product': productId
    });

    if (!order) {
      return res.status(403).json({ error: 'Only customers who purchased and received the product can leave feedback.' });
    }

    const userObj = await User.findById(req.user.id);
    const authorName = userObj ? userObj.name : 'Verified Customer';

    const review = new Review({
      product: productId,
      user: req.user.id,
      author: authorName,
      rating,
      title,
      desc,
      photos: photos || [],
      verified: true,
      status: 'pending' // Admin must moderate
    });

    await review.save();
    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Filtered reviews collection getter
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId, filter } = req.query;
    let sortOption: any = { createdAt: -1 }; // Most recent default

    if (filter === 'highest') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (filter === 'lowest') {
      sortOption = { rating: 1, createdAt: -1 };
    }

    let query: any = { product: productId, status: 'approved' };
    if (filter === 'photos') {
      query.photos = { $exists: true, $not: { $size: 0 } };
    }

    const reviews = await Review.find(query).sort(sortOption);
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// V2.1: Out-of-Stock waitlist notifications
export const joinWaitlist = async (req: Request, res: Response) => {
  try {
    const { productId, email, phone } = req.body;
    
    const waitlistEntry = new Notification({
      product: productId,
      email,
      phone
    });

    await waitlistEntry.save();
    res.status(201).json({ message: 'Registered successfully. We will alert you when stock levels return!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const regex = new RegExp(String(q), 'i');
    const conditions: any[] = [
      { name: regex },
      { category: regex },
      { fabric: regex },
      { color: regex }
    ];
    if (mongoose.Types.ObjectId.isValid(String(q))) {
      conditions.push({ _id: q });
    }
    const products = await Product.find({
      $or: conditions
    }).limit(8).select('name category fabric color price images');
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add Product Review and update rating stats dynamically
 */
export const addProductReview = async (req: any, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login to submit reviews.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Review comment cannot be empty.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const user = await User.findById(req.user.id);
    const authorName = user ? user.name : 'Verified Customer';

    // Add review to array
    const newReview = {
      userId: req.user.id,
      userName: authorName,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date()
    };

    if (!product.reviews) {
      product.reviews = [] as any;
    }

    product.reviews.push(newReview as any);

    // Recalculate average rating and reviewsCount dynamically
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.reviewsCount = product.reviews.length;
    product.rating = Number((totalRating / product.reviewsCount).toFixed(1));

    await product.save();

    res.status(201).json({
      message: 'Review submitted successfully!',
      product
    });
  } catch (err: any) {
    console.error("Add review controller error:", err);
    res.status(500).json({ error: err.message });
  }
};
