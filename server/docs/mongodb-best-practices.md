# MongoDB Best Practices for IIB Chat Application

## Current Implementation Analysis

The current MongoDB configuration in `config/database.js` follows several good practices but can be improved further.

## Recommended Best Practices

### 1. Connection Pool Management

**Current Configuration:**
```javascript
maxPoolSize: 5 // Good for development
```

**Recommendations:**
- **Development**: 5-10 connections
- **Production**: 10-100 connections (based on load)
- **Consider**: `minPoolSize: 2` to maintain minimum connections

### 2. Timeout Settings

**Current Configuration:**
```javascript
serverSelectionTimeoutMS: 10000,
socketTimeoutMS: 0, // Disabled - can cause issues
connectTimeoutMS: 10000
```

**Recommendations:**
```javascript
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000, // Enable with reasonable timeout
connectTimeoutMS: 10000,
maxTimeMS: 30000 // Query timeout
```

### 3. Replica Set Configuration

**Current Configuration:**
```javascript
retryWrites: true, // ✅ Good
w: 'majority' // ✅ Good for data consistency
```

**Additional Recommendations:**
```javascript
readPreference: 'primary', // For consistency
readConcern: { level: 'majority' } // For read consistency
```

### 4. Index Optimization

**Current Issues:**
- No explicit index management
- Potential missing indexes on frequently queried fields

**Recommendations:**

#### User Collection Indexes:
```javascript
// In User model
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isApproved: 1 });
userSchema.index({ createdAt: -1 });
```

#### Message Collection Indexes:
```javascript
// In Message model
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ 'content': 'text' }); // For text search
```

#### Chat Collection Indexes:
```javascript
// In Chat model
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ lastActivity: -1 });
```

#### Task Collection Indexes:
```javascript
// In Task model
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ teamId: 1 });
```

### 5. Query Optimization

**Current Issues:**
- Some queries may not use proper projections
- Potential N+1 query problems

**Recommendations:**

#### Use Projections:
```javascript
// Instead of
const user = await User.findById(id);

// Use
const user = await User.findById(id).select('name email role');
```

#### Use Aggregation for Complex Queries:
```javascript
// For dashboard stats, use aggregation pipeline
const stats = await Message.aggregate([
  { $match: { createdAt: { $gte: sevenDaysAgo } } },
  { $group: { _id: null, count: { $sum: 1 } } }
]);
```

#### Use Populate Wisely:
```javascript
// Limit populated fields
const tasks = await Task.find(query)
  .populate('assignedTo', 'name email')
  .populate('teamId', 'name');
```

### 6. Error Handling and Monitoring

**Current Implementation:** ✅ Good logging with winston

**Additional Recommendations:**

#### Add Connection Monitoring:
```javascript
// Add to database.js
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { 
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  
  // Optional: Send alert to monitoring service
  // alertService.sendAlert('MongoDB Connection Error', err);
});
```

#### Query Performance Monitoring:
```javascript
// Add slow query logging
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now();
  // Log slow queries (>100ms)
  if (Date.now() - start > 100) {
    logger.warn('Slow MongoDB query detected', {
      collection: collectionName,
      method,
      query,
      duration: Date.now() - start
    });
  }
});
```

### 7. Security Best Practices

**Current Implementation:** Basic security

**Recommendations:**

#### Connection String Security:
```javascript
// Use connection string with authentication
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb://username:password@localhost:27017/iib-chat?authSource=admin';
```

#### Enable Authentication:
```javascript
// In production, always use authentication
const connectionOptions = {
  authSource: 'admin',
  ssl: process.env.NODE_ENV === 'production',
  sslValidate: process.env.NODE_ENV === 'production'
};
```

### 8. Data Validation

**Current Implementation:** Basic Mongoose validation

**Enhanced Recommendations:**

#### Schema Validation:
```javascript
// Add more strict validation
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  // Add field-level validation for all fields
});
```

### 9. Backup and Recovery

**Recommendations:**

#### Automated Backups:
```bash
# Add to deployment scripts
mongodump --uri="$MONGODB_URI" --out="/backups/$(date +%Y%m%d_%H%M%S)"
```

#### Point-in-Time Recovery:
- Enable MongoDB replica sets
- Configure oplog size appropriately
- Regular backup testing

### 10. Performance Monitoring

**Recommendations:**

#### Add Performance Metrics:
```javascript
// Add to your monitoring
const getDBStats = async () => {
  const stats = await mongoose.connection.db.stats();
  return {
    collections: stats.collections,
    dataSize: stats.dataSize,
    indexSize: stats.indexSize,
    storageSize: stats.storageSize
  };
};
```

## Implementation Priority

### High Priority (Implement First):
1. Add missing indexes
2. Fix socketTimeoutMS setting
3. Add query projections
4. Implement slow query monitoring

### Medium Priority:
1. Enhance error handling
2. Add connection monitoring
3. Implement backup strategy
4. Add performance metrics

### Low Priority:
1. SSL/TLS configuration
2. Advanced aggregation optimizations
3. Sharding considerations (for future scaling)

## Monitoring and Alerts

### Key Metrics to Monitor:
- Connection pool usage
- Query response times
- Index hit ratios
- Replica set lag (if applicable)
- Disk usage and growth

### Recommended Tools:
- MongoDB Compass (development)
- MongoDB Atlas (cloud monitoring)
- Custom logging with Winston (current implementation)
- Application Performance Monitoring (APM) tools

## Conclusion

The current MongoDB implementation is solid for development but needs enhancements for production readiness. Focus on indexing, query optimization, and monitoring for immediate improvements.