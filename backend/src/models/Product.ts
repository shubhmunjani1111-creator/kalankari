import { Schema, model } from 'mongoose';

const ProductSchema = new Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  images: [{ type: String, required: true }], // Stores [Front, Back, Side, Close-up, Model, Fabric]
  category: { type: String, required: true, index: true },
  color: { type: String, required: true, index: true },
  size: [{ type: String, enum: ['S', 'M', 'L', 'XL', 'XXL'], required: true }],
  sleeveType: { type: String, required: true },
  neckType: { type: String, required: true },
  fabric: { type: String, required: true, index: true },
  availability: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
  collectionType: { type: String, required: true, index: true }, // Floral, Festive, Premium
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  description: { type: String, required: true },
  careInstructions: { type: String, default: 'Dry clean only. Gentle machine wash inside out.' },
  stockCount: { type: Number, default: 50 },
  lowStockThreshold: { type: Number, default: 10 },
  reviews: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      userName: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default model('Product', ProductSchema);
