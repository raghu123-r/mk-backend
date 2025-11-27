/**
 * Response utility helpers for consistent API responses
 * 
 * Standard envelope format:
 * {
 *   statusCode: <HTTP status>,
 *   success: <boolean>,
 *   error: <null | { message, details? }>,
 *   data: <payload|null>
 * }
 * 
 * Usage:
 *   return res.status(200).json(successResponse(data));
 *   return res.status(400).json(errorResponse('Invalid input', validationErrors));
 *   return res.status(201).json(successResponse(newUser, 'User created', 201));
 */

/**
 * Success response formatter
 * @param {*} data - The data to return
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
export const successResponse = (data, message = null, statusCode = 200) => {
  return {
    statusCode,
    success: true,
    error: null,
    data
  };
};

/**
 * Error response formatter
 * @param {string} message - Error message
 * @param {*} details - Optional error details (validation errors, stack, etc.)
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Formatted error response
 */
export const errorResponse = (message, details = null, statusCode = 400) => {
  return {
    statusCode,
    success: false,
    error: {
      message,
      ...(details && { details })
    },
    data: null
  };
};

/**
 * Pagination metadata helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
export const paginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};
