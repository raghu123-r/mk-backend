import mongoose from 'mongoose';
import User from './src/models/User.js';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const run = async () => {
  try {
    if (!uri) {
      console.error('NO_MONGO_URI');
      process.exit(1);
    }

    await mongoose.connect(uri, { dbName: 'kitchen_kettles_db' });

    const u = await User.findById('691eba2abadfbad6371cabd1').lean().exec();
    console.log(u ? JSON.stringify(u, null, 2) : 'NOT_FOUND');

    await mongoose.disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
};

run();
