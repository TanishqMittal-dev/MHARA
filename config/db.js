/**
 * Database Connection Module
 * Connects to MongoDB Atlas using Mongoose with resilient event handling
 */

const mongoose = require('mongoose');

// Attach connection event listeners to prevent unhandled EventEmitter 'error' exits
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection event error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB connection restored.');
});

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/MHARA_RealEstate';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000
    });

    console.log(`MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Initial Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
