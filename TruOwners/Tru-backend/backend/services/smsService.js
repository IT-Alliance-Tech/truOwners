const axios = require("axios");

/**
 * MySMSMantra SMS Service
 *
 * API Format:
 * GET https://api.mylogin.co.in/api/v2/SendSMS?
 *   ApiKey={ApiKey}&ClientId={ClientId}&SenderId={SenderId}
 *   &Message={Message}&MobileNumbers={MobileNumbers}
 *   &Is_Unicode={Is_Unicode}&Is_Flash={Is_Flash}
 *
 * DLT Template (ID: 1107177139911479496):
 * "Dear User, your OTP for TRUOWNERS is {#numeric#}. Do not share it with anyone. Team TRUOWNERS"
 *
 * Header/SenderId: TRUOWN
 */

const SMS_BASE_URL = "https://api.mylogin.co.in/api/v2/SendSMS";

/**
 * Build the DLT-compliant OTP message.
 * MUST exactly match the registered DLT template — no extra spaces, no line breaks.
 *
 * Template: "Dear User, your OTP for TRUOWNERS is {#numeric#}. Do not share it with anyone. Team TRUOWNERS"
 */
const buildOTPMessage = (otp) => {
  return `Dear User, your OTP for TRUOWNERS is ${otp}. Do not share it with anyone. Team TRUOWNERS`;
};

/**
 * Sanitize and format phone number for MySMSMantra.
 * MySMSMantra expects 91-prefixed 12-digit Indian mobile numbers.
 * Returns "91XXXXXXXXXX" or null if invalid.
 */
const sanitizePhoneNumber = (phone) => {
  if (!phone) return null;

  console.log(`📞 [SMS Service] Raw phone received: "${phone}"`);

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  console.log(`📞 [SMS Service] After removing non-digits: "${cleaned}" (length: ${cleaned.length})`);

  // If already 12 digits starting with 91 → valid, keep as is
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    console.log(`📞 [SMS Service] Already 91-prefixed: "${cleaned}"`);
    return cleaned;
  }

  // If 10 digits → prefix with 91
  if (cleaned.length === 10) {
    const formatted = `91${cleaned}`;
    console.log(`📞 [SMS Service] Prefixed with 91: "${formatted}"`);
    return formatted;
  }

  // Remove leading 0 if 11 digits (e.g. 07019710774)
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    const formatted = `91${cleaned.substring(1)}`;
    console.log(`📞 [SMS Service] Stripped leading 0, prefixed 91: "${formatted}"`);
    return formatted;
  }

  // Invalid format
  console.error(`❌ [SMS Service] Invalid phone format: "${phone}" → cleaned: "${cleaned}" (length: ${cleaned.length})`);
  return null;
};

/**
 * Send SMS via MySMSMantra API.
 *
 * @param {string} mobileNumber - The recipient's mobile number
 * @param {string} message - The SMS message body
 * @returns {object} - { success: boolean, data?: object, error?: string }
 */
const sendSMS = async (mobileNumber, message) => {
  const apiKey = process.env.MYSMS_API_KEY;
  const clientId = process.env.MYSMS_CLIENT_ID;
  const senderId = process.env.MYSMS_SENDER_ID;
  const templateId = process.env.MYSMS_TEMPLATE_ID;

  // ─── Validate environment variables ───
  console.log("\n📱 [SMS Service] Environment check:", {
    MYSMS_API_KEY: apiKey ? `✅ Set (${apiKey.substring(0, 10)}...)` : "❌ MISSING",
    MYSMS_CLIENT_ID: clientId ? `✅ Set (${clientId.substring(0, 10)}...)` : "❌ MISSING",
    MYSMS_SENDER_ID: senderId ? `✅ Set (${senderId})` : "❌ MISSING",
    MYSMS_TEMPLATE_ID: templateId ? `✅ Set (${templateId})` : "❌ MISSING",
  });

  if (!apiKey || !clientId || !senderId || !templateId) {
    const missing = [];
    if (!apiKey) missing.push("MYSMS_API_KEY");
    if (!clientId) missing.push("MYSMS_CLIENT_ID");
    if (!senderId) missing.push("MYSMS_SENDER_ID");
    if (!templateId) missing.push("MYSMS_TEMPLATE_ID");
    const errorMsg = `SMS configuration error: Missing env vars: ${missing.join(", ")}`;
    console.error(`❌ [SMS Service] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // ─── Sanitize phone number ───
  const cleanNumber = sanitizePhoneNumber(mobileNumber);
  if (!cleanNumber) {
    const errorMsg = `Invalid phone number format: "${mobileNumber}" — must be a 10-digit or 91-prefixed 12-digit Indian mobile number`;
    console.error(`❌ [SMS Service] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // ─── Build request URL ───
  // Message must be URL-encoded for GET request
  const params = new URLSearchParams({
    ApiKey: apiKey,
    ClientId: clientId,
    SenderId: senderId,
    Message: message,
    MobileNumbers: cleanNumber,
    Is_Unicode: false,
    Is_Flash: false,
    TemplateId: templateId,
  });

  const fullUrl = `${SMS_BASE_URL}?${params.toString()}`;

  console.log("\n📤 [SMS Service] Sending SMS request:");
  console.log(`   → To: ${cleanNumber}`);
  console.log(`   → Message: "${message}"`);
  console.log(`   → SenderId: ${senderId}`);
  console.log(`   → TemplateId: ${templateId}`);
  console.log(`   → Full URL: ${fullUrl}`);

  try {
    // MySMSMantra uses GET request
    const response = await axios.get(fullUrl, {
      timeout: 30000, // 30 second timeout
    });

    console.log("\n📥 [SMS Service] Provider response:");
    console.log(`   → Status Code: ${response.status}`);
    console.log(`   → Response Body:`, JSON.stringify(response.data, null, 2));

    // Parse provider response for known error patterns
    const responseData = response.data;
    const responseStr = typeof responseData === "string" ? responseData : JSON.stringify(responseData);

    // Check for common MySMSMantra error responses
    const errorPatterns = [
      { pattern: /invalid.*api.*key/i, message: "Invalid API Key" },
      { pattern: /invalid.*client.*id/i, message: "Invalid Client ID" },
      { pattern: /invalid.*sender/i, message: "Invalid Sender ID — check DLT registration" },
      { pattern: /template.*mismatch/i, message: "DLT Template mismatch — message doesn't match registered template" },
      { pattern: /insufficient.*balance/i, message: "Insufficient SMS balance" },
      { pattern: /balance/i, message: "Possible balance issue — check SMS credits" },
      { pattern: /ip.*not.*whitelisted/i, message: "Server IP not whitelisted in MySMSMantra panel" },
      { pattern: /unauthorized/i, message: "Unauthorized — check API credentials" },
      { pattern: /blocked/i, message: "Number or sender blocked" },
    ];

    for (const ep of errorPatterns) {
      if (ep.pattern.test(responseStr)) {
        console.error(`⚠️ [SMS Service] Provider error detected: ${ep.message}`);
        return { success: false, error: ep.message, providerResponse: responseData };
      }
    }

    // If HTTP 200, treat as success (provider-specific success check)
    if (response.status === 200) {
      console.log("✅ [SMS Service] SMS sent successfully");
      return { success: true, data: responseData };
    }

    return { success: false, error: `Unexpected status: ${response.status}`, providerResponse: responseData };
  } catch (error) {
    // ─── Handle network / HTTP errors ───
    if (error.response) {
      // Provider returned an error HTTP status
      console.error("\n❌ [SMS Service] HTTP Error from provider:");
      console.error(`   → Status: ${error.response.status}`);
      console.error(`   → Body:`, JSON.stringify(error.response.data, null, 2));
      return {
        success: false,
        error: `SMS provider returned HTTP ${error.response.status}`,
        providerResponse: error.response.data,
      };
    } else if (error.code === "ECONNABORTED") {
      console.error("❌ [SMS Service] Request timed out (30s)");
      return { success: false, error: "SMS API request timed out" };
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      console.error(`❌ [SMS Service] Network error: ${error.code} — cannot reach ${SMS_BASE_URL}`);
      return { success: false, error: `Cannot reach SMS provider: ${error.code}` };
    } else {
      console.error("❌ [SMS Service] Unexpected error:", error.message);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Send OTP SMS via MySMSMantra.
 *
 * @param {string} phone - Recipient phone number
 * @param {string} otp - The OTP code to send
 * @returns {object} - { success: boolean, data?: object, error?: string }
 */
const sendOTPSMS = async (phone, otp) => {
  if (!otp) {
    console.error("❌ [SMS Service] OTP is undefined or empty");
    return { success: false, error: "OTP is undefined or empty" };
  }

  const message = buildOTPMessage(otp);

  console.log(`\n🔐 [SMS Service] Sending OTP SMS:`);
  console.log(`   → Phone: ${phone}`);
  console.log(`   → OTP: ${otp}`);
  console.log(`   → DLT Message: "${message}"`);

  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  buildOTPMessage,
  sanitizePhoneNumber,
};
