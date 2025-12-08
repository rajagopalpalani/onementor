const { v4: uuidv4 } = require('uuid');

/**
 * Generate a UUID v4 (random UUID)
 * @returns {string} UUID string
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate customer ID for a mentor/user
 * Format: customer_{user_id}_{email_prefix}
 * 
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @returns {string} Customer ID
 */
function generateCustomerId(userId, email) {
  if (!userId || !email) {
    throw new Error('userId and email are required to generate customerId');
  }
  
  const emailPrefix = email.split('@')[0];
  return `customer_${userId}_${emailPrefix}`;
}

/**
 * Generate order ID
 * Can use UUID or custom format
 * 
 * @param {string} prefix - Optional prefix for order ID (e.g., 'PAYOUT', 'BOOKING')
 * @returns {string} Order ID
 */
function generateOrderId(prefix = null) {
  if (prefix) {
    // Format: PREFIX_TIMESTAMP_UUID_SHORT
    const timestamp = Date.now();
    const uuidShort = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    return `${prefix}_${timestamp}_${uuidShort}`;
  }
  
  // Return just UUID if no prefix
  return uuidv4();
}

module.exports = {
  generateUUID,
  generateCustomerId,
  generateOrderId
};

