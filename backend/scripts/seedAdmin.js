require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fraud_detection';

const adminName = process.env.ADMIN_NAME || 'Security Administrator';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@fraudshield.ai';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Security2026!';

async function seedAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for admin seeding...');

    const User = require('../models/User');

    let admin = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (admin) {
      admin.name = adminName;
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.status = 'active';
      admin.isFrozen = false;
      await admin.save();
      console.log(`Admin account updated: ${adminEmail}`);
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        isFrozen: false
      });
      console.log(`Admin account created: ${adminEmail}`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin account:', err);
    process.exit(1);
  }
}

seedAdmin();
