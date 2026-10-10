import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

dotenv.config();

async function seedAdmin() {
  await connectDB();

  const email = (process.env.ADMIN_SEED_EMAIL || 'admin@uiu.ac.bd').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 10) {
    console.error('[Admin Seed Error]: Set ADMIN_SEED_PASSWORD (at least 10 characters) in server/.env first.');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[Admin Seed]: Admin account '${email}' already exists.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name: process.env.ADMIN_SEED_NAME || 'Portal Administrator',
    email,
    passwordHash,
    role: 'admin',
    status: 'active'
  });

  console.log(`[Admin Seed Success]: Created Administrator account '${admin.email}' using the password from ADMIN_SEED_PASSWORD.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('[Admin Seed Error]:', err);
  process.exit(1);
});
