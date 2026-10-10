import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    // Mask password in URI
    const uri = process.env.MONGODB_URI || '';
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');

    console.log('\n========================================');
    console.log('   MONGODB CONNECTION DIAGNOSTIC INFO   ');
    console.log('========================================');
    console.log(`Status            : CONNECTED ✅`);
    console.log(`Connection State  : ${conn.connection.readyState} (1 = Connected)`);
    console.log(`Database Name     : ${conn.connection.name}`);
    console.log(`Host              : ${conn.connection.host}`);
    console.log(`Port              : ${conn.connection.port || 'Default (27017 / SRV)'}`);
    console.log(`Connection String : ${maskedUri}`);
    
    console.log('\n========================================');
    console.log('   DATABASE COLLECTIONS & RECORD COUNTS ');
    console.log('========================================');
    
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in this database.');
    } else {
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`📦 Collection [${col.name.padEnd(20)}]: ${count} records`);
      }
    }
    console.log('========================================\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    process.exit(1);
  }
}

checkDatabase();
