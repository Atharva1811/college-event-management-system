import mongoose from 'mongoose';

let isDbConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '' || uri.includes('<username>')) {
    console.warn('\n⚠️ [MongoDB] MONGO_URI is not configured in .env.');
    console.warn('ℹ️ [MongoDB] Backend is running in NO-DATABASE mode. (Database-dependent endpoints will return structured errors; frontend operates with full mock data layer).\n');
    isDbConnected = false;
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    isDbConnected = true;
    console.log(`\n✅ [MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}\n`);
  } catch (error) {
    isDbConnected = false;
    console.error(`\n❌ [MongoDB] Connection error: ${error.message}`);
    console.warn('ℹ️ [MongoDB] Continuing in NO-DATABASE mode without crashing...\n');
  }
};

export const isConnected = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};

export default connectDB;
