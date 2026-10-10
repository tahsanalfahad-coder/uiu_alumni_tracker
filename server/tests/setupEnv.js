// Runs before every test file. Keeps tests isolated from your real .env:
//  - a throwaway JWT secret
//  - an empty MONGODB_URI so dotenv cannot inject your real (Atlas) database
//    (setting it to '' stops dotenv from overriding it; connectDB then falls back to localhost)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-do-not-use-anywhere-else-0123456789';
process.env.MONGODB_URI = '';
