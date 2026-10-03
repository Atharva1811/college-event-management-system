import mongoose from 'mongoose';
import { autoSeedIfEmpty } from '../scripts/seed.js';

let isDbConnected = false;
let reconnectTimer = null;

// Real-time Mongoose connection lifecycle listeners
mongoose.connection.on('connected', () => {
  isDbConnected = true;
  console.log(`\n✅ [MongoDB] Connected to database: ${mongoose.connection.name} @ ${mongoose.connection.host}\n`);
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  // Automatically seed the database if it is currently empty
  autoSeedIfEmpty().catch((err) => {
    console.error('⚠️ [MongoDB] Auto-seed check error:', err.message);
  });
});

mongoose.connection.on('error', (err) => {
  isDbConnected = false;
  console.error(`\n❌ [MongoDB] Connection error: ${err.message}\n`);
});

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('\n⚠️ [MongoDB] Connection disconnected.\n');
  scheduleReconnect();
});

const scheduleReconnect = () => {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.trim() === '' || uri.includes('<username>')) return;
  if (reconnectTimer) return;

  console.log('🔄 [MongoDB] Scheduling automatic reconnect attempt in 10s...');
  reconnectTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
      return;
    }
    try {
      console.log('🔄 [MongoDB] Retrying connection to MongoDB Atlas...');
      await mongoose.connect(uri);
    } catch (err) {
      console.warn(`⏳ [MongoDB] Reconnect attempt failed (${err.message}). Retrying in 10s...`);
    }
  }, 10000);
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.trim() === '' || uri.includes('<username>')) {
    console.warn('\n⚠️ [MongoDB] MONGO_URI is not configured in environment variables.');
    console.warn('ℹ️ [MongoDB] Backend is waiting for MongoDB Atlas connection.\n');
    isDbConnected = false;
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    isDbConnected = true;
    console.log(`\n✅ [MongoDB] Initial connection established: ${conn.connection.name} @ ${conn.connection.host}\n`);
    await autoSeedIfEmpty();
  } catch (error) {
    isDbConnected = false;
    console.error(`\n❌ [MongoDB] Connection failed: ${error.message}`);
    scheduleReconnect();
  }
};

export const isConnected = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};

export default connectDB;
