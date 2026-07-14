import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload Base64 Image to Cloudinary
 * Secures credentials on the server side and outputs safe URLs.
 */
export const uploadToCloudinary = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image content is required in base64 format.' });
    }

    // Securely check environment vars before attempting upload
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('[CLOUDINARY] Credentials missing. Falling back to local demo paths.');
      // Return a placeholder demo URL to prevent breaking catalog addition when envs are not yet set
      return res.json({
        url: '/logo.jpg',
        public_id: 'local_fallback_logo'
      });
    }

    console.log('[CLOUDINARY] Uploading image base64 stream to Cloudinary...');
    const result = await cloudinary.uploader.upload(image, {
      folder: 'kalankari_products',
      resource_type: 'auto'
    });

    console.log(`[CLOUDINARY] Upload success. secureUrl: ${result.secure_url}`);

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (err: any) {
    console.error('[CLOUDINARY] Secure upload failed:', err);
    res.status(500).json({ error: err.message || 'Cloudinary storage failed.' });
  }
};
