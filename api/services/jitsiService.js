/**
 * Jitsi Meet Service
 * Generates Jitsi room URLs and configuration for video meetings
 */

require('dotenv').config();

// Jitsi Meet domain - can be self-hosted or use meet.jit.si
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';
const JITSI_APP_ID = process.env.JITSI_APP_ID || 'onementor';

/**
 * Generate a unique room name for a booking
 * @param {number} bookingId - Booking ID
 * @param {boolean} deterministic - If true, generates a deterministic room name (same for same bookingId)
 * @returns {string} Room name
 */
function generateRoomName(bookingId, deterministic = true) {
  if (deterministic) {
    // Create a deterministic room name - same bookingId = same room name
    // This ensures user and mentor join the same room
    return `${JITSI_APP_ID}-booking-${bookingId}`;
  } else {
    // Legacy: Create a unique, URL-safe room name with timestamp (for backward compatibility)
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${JITSI_APP_ID}-${bookingId}-${timestamp}-${randomSuffix}`;
  }
}

/**
 * Extract room name from a Jitsi URL
 * @param {string} jitsiUrl - Full Jitsi URL
 * @returns {string|null} Room name or null if invalid
 */
function extractRoomNameFromUrl(jitsiUrl) {
  if (!jitsiUrl) return null;
  try {
    const url = new URL(jitsiUrl);
    const roomName = url.pathname.split('/').pop() || url.pathname.replace('/', '');
    // Remove query params and hash if present
    return roomName.split('?')[0].split('#')[0];
  } catch (e) {
    // If not a full URL, try to extract from string
    const match = jitsiUrl.match(/\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Create Jitsi room configuration
 * @param {Object} options - Room options
 * @param {number} options.bookingId - Booking ID
 * @param {Date} options.startDateTime - Session start time
 * @param {Date} options.endDateTime - Session end time
 * @param {Object} options.user - User information
 * @param {string} options.user.id - User ID
 * @param {string} options.user.name - User display name
 * @param {string} options.user.email - User email
 * @param {string} options.user.role - User role ('mentor' or 'user')
 * @returns {Object} Jitsi room configuration
 */
function createJitsiRoom(options) {
  const { bookingId, startDateTime, endDateTime, user, existingRoomName } = options;

  if (!bookingId || !user) {
    throw new Error('Booking ID and user information are required');
  }

  // Use existing room name if provided, otherwise generate a deterministic one
  const roomName = existingRoomName || generateRoomName(bookingId, true);
  
  // Build Jitsi Meet URL with user information
  const jitsiUrl = `https://${JITSI_DOMAIN}/${roomName}`;
  
    // Configure Jitsi Meet interface options
    const config = {
      roomName: roomName,
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableInitialGUM: true, 
        disableTileView: true,
        enableWelcomePage: false,
        enableClosePage: false,
        disableDeepLinking: true,
        defaultLanguage: 'en',
        // Disable invite and share features
        disableInviteFunctions: true,
        disableThirdPartyRequests: true,
        // Security
        requireDisplayName: true,
        enableNoAudioDetection: true,
        enableNoisyMicDetection: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: 'OneMentor',
        NATIVE_APP_NAME: 'OneMentor',
        PROVIDER_NAME: 'OneMentor',
        // Hide invite, add people, and share buttons
        SHARE_BUTTON_ENABLED: false,
        INVITE_ENABLED: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'recording',
          'livestreaming', 'etherpad', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
          // Excluded: 'invite', 'sharedvideo', 'shareaudio'
        ],
      },
      userInfo: {
        displayName: user.name || 'User',
        email: user.email || '',
      },
    };

  // Add query parameters for pre-filled user info
  const urlParams = new URLSearchParams({
    userInfo: JSON.stringify({
      displayName: user.name || 'User',
      email: user.email || '',
    }),
    // Optional: Add JWT token if you implement JWT authentication later
    // jwt: generateJWT(roomName, user)
  });

  const fullUrl = `${jitsiUrl}?${urlParams.toString()}`;

  return {
    roomName: roomName,
    jitsiUrl: fullUrl,
    baseUrl: jitsiUrl,
    config: config,
    userInfo: {
      displayName: user.name || 'User',
      email: user.email || '',
      role: user.role || 'user'
    },
    // For backward compatibility - this will be the URL stored in database
    meetingLink: fullUrl,
    // Session timing info
    startDateTime: startDateTime,
    endDateTime: endDateTime
  };
}

/**
 * Generate a simple Jitsi room URL (for backward compatibility)
 * @param {number} bookingId - Booking ID
 * @returns {string} Jitsi room URL
 */
function generateSimpleJitsiUrl(bookingId) {
  const roomName = generateRoomName(bookingId);
  return `https://${JITSI_DOMAIN}/${roomName}`;
}

module.exports = {
  createJitsiRoom,
  generateRoomName,
  generateSimpleJitsiUrl,
  extractRoomNameFromUrl
};
