import mongoose from 'mongoose';
import { isTest } from './env.js';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost', '::1', '[::1]'];

// Never print credentials embedded in the connection string.
export const redactUri = (uri) => String(uri).replace(/\/\/([^@/]+)@/, '//***@');

// The test suite wipes collections. Refuse to run it against anything but a local database.
export const assertSafeForTests = (uri) => {
  if (!isTest()) return;
  const match = /^mongodb:\/\/(?:[^@/]*@)?([^/:?,]+)/.exec(uri);
  if (!match || !LOCAL_HOSTS.includes(match[1])) {
    throw new Error(
      'Refusing to connect tests to a non-local database. Tests delete data; use the in-memory server or a local MongoDB.'
    );
  }
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uiu-alumni-portal';
  assertSafeForTests(mongoURI);

  try {
    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Failed]: ${redactUri(mongoURI)} (${redactUri(error.message)})`);
    console.error('[MongoDB Guidance]: Ensure MongoDB is running or set a valid MONGODB_URI in server/.env.');
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
