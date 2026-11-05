const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');

// Fix for querySrv ECONNREFUSED on MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  // fallback if custom DNS servers cannot be set
}

if (!process.env.MONGODB_URL) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URL;
    const dbName = process.env.MONGODB_DATABASE || 'sar_platform';

    if (!mongoURI) {
      console.warn('⚠️ MONGODB_URL is not defined. Server running in disconnected mode.');
      return;
    }

    const conn = await mongoose.connect(mongoURI, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} (DB: ${dbName})`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Notice: ${error.message}`);
    console.log('👉 Note: If using MongoDB Atlas, ensure your current IP is whitelisted (e.g. 0.0.0.0/0 for all IPs) in Atlas > Network Access.');
  }
};

module.exports = connectDB;
