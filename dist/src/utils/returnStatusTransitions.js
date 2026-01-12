/**
 * Return/Refund Status Transition Utility
 * Handles validation and tracking of status changes in return requests
 */

/**
 * Valid status transitions map
 * Defines which statuses can transition to which other statuses
 * Key: current status -> Value: array of allowed next statuses
 */
const VALID_TRANSITIONS = {
  // Initial request state
  'return_requested': ['return_approved', 'return_rejected'],
  
  // After approval
  'return_approved': ['pickup_scheduled', 'return_rejected'],
  
  // After pickup scheduled
  'pickup_scheduled': ['product_received', 'return_rejected'],
  
  // After product received - branches based on actionType
  'product_received': ['refund_initiated', 'return_completed'],
  
  // Refund flow (only for return_refund actionType)
  'refund_initiated': ['refund_completed', 'return_rejected'],
  'refund_completed': ['return_completed'],
  
  // Terminal states
  'return_completed': [], // No further transitions
  'return_rejected': [],  // No further transitions
  
  // Legacy status mappings for backward compatibility
  'pending': ['return_approved', 'approved', 'return_rejected', 'rejected'],
  'approved': ['pickup_scheduled', 'return_completed', 'completed'],
  'rejected': [],
  'completed': []
};

/**
 * Status labels for display
 */
const STATUS_LABELS = {
  'return_requested': 'Return Requested',
  'return_approved': 'Return Approved',
  'pickup_scheduled': 'Pickup Scheduled',
  'product_received': 'Product Received',
  'refund_initiated': 'Refund Initiated',
  'refund_completed': 'Refund Completed',
  'return_completed': 'Return Completed',
  'return_rejected': 'Return Rejected',
  // Legacy
  'pending': 'Pending',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'completed': 'Completed'
};

/**
 * Normalize legacy status to new status
 * Maintains backward compatibility
 */
const normalizeLegacyStatus = (status) => {
  const legacyMap = {
    'pending': 'return_requested',
    'approved': 'return_approved',
    'rejected': 'return_rejected',
    'completed': 'return_completed'
  };
  return legacyMap[status] || status;
};

/**
 * Validate if a status transition is allowed
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Desired new status
 * @param {string} actionType - 'return' or 'return_refund'
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validateStatusTransition = (currentStatus, newStatus, actionType) => {
  // Normalize legacy statuses
  const normalizedCurrent = normalizeLegacyStatus(currentStatus);
  const normalizedNew = normalizeLegacyStatus(newStatus);
  
  // Check if current status allows any transitions
  const allowedTransitions = VALID_TRANSITIONS[normalizedCurrent] || [];
  
  if (!allowedTransitions.includes(normalizedNew)) {
    return {
      valid: false,
      error: `Cannot transition from "${STATUS_LABELS[normalizedCurrent] || normalizedCurrent}" to "${STATUS_LABELS[normalizedNew] || normalizedNew}"`
    };
  }
  
  // Special validation: refund states only allowed for return_refund
  const refundStates = ['refund_initiated', 'refund_completed'];
  if (refundStates.includes(normalizedNew) && actionType !== 'return_refund') {
    return {
      valid: false,
      error: 'Refund statuses are only allowed for return+refund requests'
    };
  }
  
  // Special validation: if actionType is 'return', skip refund states
  if (actionType === 'return' && normalizedCurrent === 'product_received') {
    if (normalizedNew === 'refund_initiated') {
      return {
        valid: false,
        error: 'Cannot initiate refund for return-only requests. Use "return_completed" instead.'
      };
    }
  }
  
  return { valid: true, error: null };
};

/**
 * Get allowed next statuses for a given current status and actionType
 * @param {string} currentStatus - Current status
 * @param {string} actionType - 'return' or 'return_refund'
 * @returns {Array<string>} Array of allowed next status values
 */
export const getAllowedNextStatuses = (currentStatus, actionType) => {
  const normalizedCurrent = normalizeLegacyStatus(currentStatus);
  let allowedTransitions = VALID_TRANSITIONS[normalizedCurrent] || [];
  
  // Filter out refund states for return-only requests
  if (actionType === 'return') {
    allowedTransitions = allowedTransitions.filter(
      status => !['refund_initiated', 'refund_completed'].includes(status)
    );
  }
  
  // Normalize legacy statuses in allowed transitions
  return allowedTransitions.map(status => normalizeLegacyStatus(status));
};

/**
 * Create a status history entry
 * @param {string} status - New status
 * @param {string} updatedBy - 'system', 'admin', or 'user'
 * @param {string|null} userId - User ID who made the change (optional)
 * @param {string|null} notes - Optional notes about the change
 * @returns {Object} Status history entry
 */
export const createStatusHistoryEntry = (status, updatedBy, userId = null, notes = null) => {
  return {
    status: normalizeLegacyStatus(status),
    updatedBy,
    updatedByUserId: userId,
    timestamp: new Date(),
    notes
  };
};

/**
 * Get user-friendly status label
 * @param {string} status - Status code
 * @returns {string} Display label
 */
export const getStatusLabel = (status) => {
  const normalized = normalizeLegacyStatus(status);
  return STATUS_LABELS[normalized] || status;
};

/**
 * Check if status is terminal (no further transitions allowed)
 * @param {string} status - Status to check
 * @returns {boolean}
 */
export const isTerminalStatus = (status) => {
  const normalized = normalizeLegacyStatus(status);
  return ['return_completed', 'return_rejected'].includes(normalized);
};

/**
 * Get recommended next status based on current status and actionType
 * @param {string} currentStatus - Current status
 * @param {string} actionType - 'return' or 'return_refund'
 * @returns {string|null} Recommended next status or null if terminal
 */
export const getRecommendedNextStatus = (currentStatus, actionType) => {
  const allowedStatuses = getAllowedNextStatuses(currentStatus, actionType);
  
  if (allowedStatuses.length === 0) {
    return null;
  }
  
  // Return the most logical next step (first in the flow)
  const normalizedCurrent = normalizeLegacyStatus(currentStatus);
  
  // Define the happy path flow
  const happyPathMap = {
    'return_requested': 'return_approved',
    'return_approved': 'pickup_scheduled',
    'pickup_scheduled': 'product_received',
    'product_received': actionType === 'return_refund' ? 'refund_initiated' : 'return_completed',
    'refund_initiated': 'refund_completed',
    'refund_completed': 'return_completed'
  };
  
  return happyPathMap[normalizedCurrent] || allowedStatuses[0];
};

export default {
  validateStatusTransition,
  getAllowedNextStatuses,
  createStatusHistoryEntry,
  getStatusLabel,
  isTerminalStatus,
  getRecommendedNextStatus,
  normalizeLegacyStatus
};
