import ContactSubmission from '../models/ContactSubmission.model.js';
import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !phone || !email) {
      return res.status(400).json({ ok: false, error: 'Name, mobile and email are required.' });
    }
    
    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email address.' });
    }

    // Create contact submission with mobile field (map from phone)
    const contact = new ContactSubmission({ 
      name, 
      mobile: phone,  // Map phone to mobile
      email, 
      subject, 
      message 
    });
    
    await contact.save();

    // Log DB connection details for verification
    console.log('✅ Contact saved to DB:', mongoose.connection.name || mongoose.connection.db?.databaseName);
    console.log('   Collection:', contact.collection.name);
    console.log('   Host:', mongoose.connection.host || 'Atlas');

    return res.status(201).json({ 
      ok: true, 
      message: 'Contact saved successfully.',
      data: contact 
    });
  } catch (err) {
    console.error('createContact error', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
