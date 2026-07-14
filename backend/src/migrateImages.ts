import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import Product from './models/Product';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kalankari';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const migrate = async () => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("\n❌ Error: Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing in backend/.env!");
      console.log("Please define these in backend/.env first and run the script again.\n");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const productsDir = path.join(__dirname, '../../frontend/public/products');
    if (!fs.existsSync(productsDir)) {
      console.error(`❌ Error: Products directory not found at ${productsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(productsDir);
    console.log(`Found ${files.length} local images in public/products folder.`);

    const urlMap: { [key: string]: string } = {};

    for (const file of files) {
      const filePath = path.join(productsDir, file);
      const localKey = `/products/${file}`;
      
      console.log(`Uploading ${file} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'kalankari_products',
        resource_type: 'image'
      });
      
      console.log(`✅ Uploaded. CDN URL: ${uploadResult.secure_url}`);
      urlMap[localKey] = uploadResult.secure_url;
    }

    // Update MongoDB database products
    const dbProducts = await Product.find();
    console.log(`Updating ${dbProducts.length} database products with Cloudinary links...`);

    let updatedCount = 0;
    for (const p of dbProducts) {
      let modified = false;
      const newImages = p.images.map(img => {
        const decodedImg = decodeURIComponent(img);
        if (urlMap[decodedImg]) {
          modified = true;
          return urlMap[decodedImg];
        }
        if (urlMap[img]) {
          modified = true;
          return urlMap[img];
        }
        return img;
      });

      if (modified) {
        p.images = newImages;
        await p.save();
        updatedCount++;
      }
    }
    console.log(`✅ Database migration complete. Updated ${updatedCount} products.`);

    // Rewrite seeder.ts file so re-seeds are Cloudinary-driven
    const seederPath = path.join(__dirname, 'seeder.ts');
    if (fs.existsSync(seederPath)) {
      console.log("Updating backend/src/seeder.ts template with Cloudinary URLs...");
      let seederContent = fs.readFileSync(seederPath, 'utf8');
      for (const [localKey, cloudUrl] of Object.entries(urlMap)) {
        seederContent = seederContent.split(`"${localKey}"`).join(`"${cloudUrl}"`);
        seederContent = seederContent.split(`'${localKey}'`).join(`'${cloudUrl}'`);
      }
      fs.writeFileSync(seederPath, seederContent, 'utf8');
      console.log("✅ backend/src/seeder.ts updated successfully.");
    }

    console.log("\n🚀 Migration successfully completed! All local photos uploaded to Cloudinary.");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

migrate();
