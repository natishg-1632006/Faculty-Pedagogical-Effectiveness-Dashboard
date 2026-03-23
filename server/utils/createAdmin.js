import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    let admin = await User.findOne({ email: 'admin@gmail.com' });

    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'Admin',
        isActive: true,
        mustChangePassword: false
      });
    } else {
      admin.name = 'Admin';
      admin.password = 'admin123';
      admin.role = 'Admin';
      admin.isActive = true;
      admin.mustChangePassword = false;
    }

    await admin.save();

    console.log(`Admin ready: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
