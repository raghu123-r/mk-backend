import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  console.log('Connected DB:', mongoose.connection.db?.databaseName || mongoose.connection.name || 'N/A');
  console.log('Host:', mongoose.connection.host || 'Atlas/Cloud');
}).catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});
