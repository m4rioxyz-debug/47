// =====================================================================
//  47 CULT Dashboard — Database Connection
// =====================================================================

const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
    console.log(`  [DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('  [DB] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
