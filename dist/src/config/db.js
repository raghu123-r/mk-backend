import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('Mongo connection error', err);
  process.exit(1);
});
