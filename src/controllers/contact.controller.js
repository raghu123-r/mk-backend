import ContactSubmission from '../models/ContactSubmission.model.js';
import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !phone || !email) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Name, mobile and email are required.' },
        data: null
      });
    }
    
    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid email address.' },
        data: null
      });
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

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: contact
    });
  } catch (err) {
    console.error('createContact error', err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Unable to submit your message. Please try again or email us directly.' },
      data: null
    });
  }
};
