import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Migration endpoint to upload existing local photos to Cloudinary
 */
export const uploadLocalImagesToCloudinary = async (req: Request, res: Response) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({ error: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing in backend/.env!" });
    }

    const productsDir = path.join(__dirname, '../../../frontend/public/products');
    if (!fs.existsSync(productsDir)) {
      return res.status(400).json({ error: `Local products photo directory not found at ${productsDir}` });
    }

    const files = fs.readdirSync(productsDir);
    console.log(`[MIGRATION] Found ${files.length} local images. Beginning Cloudinary uploads...`);
    const urlMap: { [key: string]: string } = {};

    for (const file of files) {
      const filePath = path.join(productsDir, file);
      const localKey = `/products/${file}`;
      
      console.log(`[MIGRATION] Uploading ${file} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'kalankari_products',
        resource_type: 'image'
      });
      
      console.log(`[MIGRATION] Uploaded: ${localKey} -> ${uploadResult.secure_url}`);
      urlMap[localKey] = uploadResult.secure_url;
    }

    // Update MongoDB database products
    const dbProducts = await Product.find();
    console.log(`[MIGRATION] Updating ${dbProducts.length} database products...`);
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

    // Rewrite seeder.ts file so re-seeds are Cloudinary-driven
    const seederPath = path.join(__dirname, '../seeder.ts');
    if (fs.existsSync(seederPath)) {
      let seederContent = fs.readFileSync(seederPath, 'utf8');
      for (const [localKey, cloudUrl] of Object.entries(urlMap)) {
        seederContent = seederContent.split(`"${localKey}"`).join(`"${cloudUrl}"`);
        seederContent = seederContent.split(`'${localKey}'`).join(`'${cloudUrl}'`);
      }
      fs.writeFileSync(seederPath, seederContent, 'utf8');
      console.log(`[MIGRATION] backend/src/seeder.ts successfully rewritten with Cloudinary URLs.`);
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${files.length} local images to Cloudinary and updated ${updatedCount} products in MongoDB!`,
      urlMap
    });
  } catch (err: any) {
    console.error("[MIGRATION] Process failed:", err);
    res.status(500).json({ error: err.message || "Migration failed" });
  }
};
