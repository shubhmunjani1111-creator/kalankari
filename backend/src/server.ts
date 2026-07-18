import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import User from './models/User';
import { seedProducts } from './seeder';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kalankari';

const seedAdminUser = async () => {
  try {
    const adminEmail = 'kalankari8972@gmail.com';
    const existing = await User.findOne({ email: adminEmail });
    
    if (!existing) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'KalankariAdmin@2026';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = new User({
        name: 'Kalankari Admin',
        email: adminEmail,
        password: hashedPassword,
        phone: '8866448972',
        role: 'admin',
        loyaltyPoints: 0
      });
      
      await adminUser.save();
      console.log(`[SEED] One-time admin credential seeded successfully! Email: ${adminEmail}`);
    } else {
      console.log(`[SEED] Admin credential already exists in database.`);
    }
  } catch (err) {
    console.error(`[SEED] Error seeding admin user:`, err);
  }
};

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas / Local cluster');
    await seedAdminUser();
    await seedProducts();
    try {
      const { migrateOrderNumbers } = require('./scripts/migrateOrderNumbers');
      await migrateOrderNumbers();
    } catch (migErr) {
      console.error('[BOOT] Order Number migration trigger error:', migErr);
    }
    app.listen(PORT, () => {
      console.log(`Kalankari backend API server active on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
