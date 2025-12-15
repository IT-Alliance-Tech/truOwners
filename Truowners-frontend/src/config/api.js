// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5001/api',
  
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    VALIDATE_OTP: '/auth/validate-otp',
    SEND_OTP: '/auth/send-otp',
    LOGIN_OTP: '/auth/login/otp',
    LOGIN_PASSWORD: '/auth/login/password',

    // Forgot password flow
    FORGOT_PASSWORD: '/auth/forgot-password',   // Send OTP for password reset
    RESET_PASSWORD: '/auth/reset-password',     // Verify OTP & set new password
    RESEND_OTP: '/auth/resend-otp'               // Optional: separate resend OTP route if available
  },
  
  // Owner endpoints
  OWNER: {
    PROPERTIES: '/owner/properties'
  },

  ADMIN: {
    USERS: '/admin/users',
    PROPERTIES: '/admin/properties',
    REVIEW_PROPERTY: '/admin/properties/:id/review',
    PUBLISH_PROPERTY: '/admin/properties/:id',
    BOOKINGS: '/booking/all',                    
    BOOKING_ANALYTICS: '/booking/analytics',     
    UPDATE_BOOKING: '/booking/:id/status',
    PAYMENTS: '/admin/payments',
    USER_SUBSCRIPTION_HISTORY: '/admin/users/:userId/history'
  },

  USER: {
    PROPERTIES: '/user/properties',
    WISHLIST: '/user/wishlist',
    WISHLIST_REMOVE: '/user/wishlist',
    CONTACTOWNER: '/user/unlock-contact',
    BOOKING_ADD: '/booking',
    BOOKING_UPDATE: '/booking/:id/update-time',
  },

  // Subscription endpoints
  SUBSCRIPTION: {
    PLANS: '/subscriptions/plans',
    SEED: '/subscriptions/seed',
    SUBSCRIBE: '/subscriptions/subscribe',
    UPGRADE: '/subscriptions/upgrade',
    MY_SUBSCRIPTION: '/subscriptions/me',
    CANCEL: '/subscriptions/cancel'
  },

  // Payment endpoints
  PAYMENT: {
    INITIATE: '/payment/initiate',
    CALLBACK: '/payment/callback',
    STATUS: '/payment/status',
    HISTORY: '/payment/history'
  },

  // Property View endpoints
  PROPERTY_VIEWS: {
    VIEW_OWNER: '/property-views/view-owner',
    VIEWED_PROPERTIES: '/property-views/viewed'
  }
}

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}
