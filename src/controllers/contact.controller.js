import ContactSubmission from '../models/ContactSubmission.model.js';
import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createContact = async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Name, mobile and email are required.' },
        data: null
      });
    }
    
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid email address.' },
        data: null
      });
    }

    const contact = new ContactSubmission({ 
      name, 
      mobile: phone,
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

export const getAdminContactSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await ContactSubmission.countDocuments();
    const submissions = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('getAdminContactSubmissions error', err);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch contact submissions.' },
      data: null
    });
  }
};