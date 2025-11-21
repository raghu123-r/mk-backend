import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import ContactSubmission from './src/models/ContactSubmission.model.js';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const run = async () => {
  try {
    if (!uri) {
      console.error('NO_MONGO_URI');
      process.exit(1);
    }

    await mongoose.connect(uri);

    // Log connection details
    console.log('\n🔗 Database Connection Details:');
    console.log('   Database:', mongoose.connection.db?.databaseName || mongoose.connection.name || 'N/A');
    console.log('   Host:', mongoose.connection.host || 'MongoDB Atlas');
    console.log('   Collection:', ContactSubmission.collection.name);
    console.log('');

    const contacts = await ContactSubmission.find().sort({ createdAt: -1 }).limit(5).lean().exec();
    
    console.log(`\nFound ${contacts.length} contact submission(s):\n`);
    contacts.forEach((contact, i) => {
      console.log(`${i + 1}. ${contact.name} (${contact.email}) - ${contact.mobile}`);
      console.log(`   Subject: ${contact.subject || 'N/A'}`);
      console.log(`   Message: ${contact.message || 'N/A'}`);
      console.log(`   Created: ${contact.createdAt}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
};

run();
