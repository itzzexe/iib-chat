const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB connection options
const connectionOptions = {
  // Connection settings
  maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 5,
  minPoolSize: 2, // Maintain minimum connections
  serverSelectionTimeoutMS: 5000, // Reduced timeout for faster failure detection
  socketTimeoutMS: 45000, // Enable socket timeout to prevent hanging connections
  
  // Replica set settings
  retryWrites: true,
  w: 'majority',
  readPreference: 'primary', // Ensure read consistency
  readConcern: { level: 'majority' } // Read consistency
};

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iib-chat';
    
    logger.info('Connecting to MongoDB', { 
      uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') 
    });
    
    // Connect to MongoDB with timeout
    await mongoose.connect(MONGODB_URI, {
      ...connectionOptions,
      connectTimeoutMS: 10000 // Connection timeout
    });
    
    logger.info('Connected to MongoDB', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name
    });
    
    // Enable slow query logging in development
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug('MongoDB Query', {
          collection: collectionName,
          method,
          query: JSON.stringify(query)
        });
      });
    }
    
    // Set flag to indicate MongoDB is available
    global.mongodbAvailable = true;
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection', { error: error.message });
        process.exit(1);
      }
    });
    
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    throw error;
    
    // In development, allow server to start without MongoDB for testing
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Starting server without MongoDB connection in development mode');
      // Set a flag to indicate MongoDB is not available
      global.mongodbAvailable = false;
      return;
    }
    
    process.exit(1);
  }
};

// Health check function
const checkDBHealth = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name
  };
};

module.exports = { connectDB, checkDBHealth };