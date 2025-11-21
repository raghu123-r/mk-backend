/**
 * Response utility helpers for consistent API responses
 * 
 * Usage:
 *   return res.json(successResponse(data));
 *   return res.status(400).json(errorResponse('Invalid input', errors));
 */

/**
 * Success response formatter
 * @param {*} data - The data to return
 * @param {string} message - Optional success message
 * @returns {Object} Formatted success response
 */
export const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
};

/**
 * Error response formatter
 * @param {string} message - Error message
 * @param {Array} errors - Optional array of validation errors
 * @returns {Object} Formatted error response
 */
export const errorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  
  return response;
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
