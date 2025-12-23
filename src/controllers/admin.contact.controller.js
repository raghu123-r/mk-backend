// ADMIN: contact submissions
/**
 * Admin Contact Submissions Controller
 * Provides read-only access to contact form submissions for admin users
 */

import ContactSubmission from '../models/ContactSubmission.model.js';

/**
 * GET /api/admin/contact-submissions
 * List all contact form submissions (read-only)
 * Sorted by most recent first
 */
export const listContactSubmissions = async (req, res) => {
  try {
    // Fetch all submissions sorted by creation date (newest first)
    const submissions = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch contact submissions' },
      data: null
    });
  }
};
