/**
 * manualSmsTest.js
 * 
 * Standalone test script to hit MySMSMantra API directly.
 * Run:  node manualSmsTest.js <10-digit-phone-number>
 * 
 * Tests TWO message formats:
 *   Test 1: Single-line (matches DLT registered template exactly)
 *   Test 2: Multi-line (with \n line breaks)
 * 
 * Compare results to identify if DLT template mismatch is the root cause.
 * 
 * ⚠️  This is a temporary test script. Delete after debugging.
 */

require("dotenv").config();
const axios = require("axios");

const SMS_BASE_URL = "https://api.mylogin.co.in/api/v2/SendSMS";
const TEST_OTP = "0101";

// ─── Validate env vars upfront ───
const apiKey = process.env.MYSMS_API_KEY;
const clientId = process.env.MYSMS_CLIENT_ID;
const senderId = process.env.MYSMS_SENDER_ID;
const templateId = process.env.MYSMS_TEMPLATE_ID;

console.log("═══════════════════════════════════════════════");
console.log("  MySMSMantra Manual Test Script");
console.log("═══════════════════════════════════════════════\n");

console.log("📋 Environment variables:");
console.log(`   MYSMS_API_KEY     = ${apiKey ? `"${apiKey}"` : "❌ UNDEFINED"}`);
console.log(`   MYSMS_CLIENT_ID   = ${clientId ? `"${clientId}"` : "❌ UNDEFINED"}`);
console.log(`   MYSMS_SENDER_ID   = ${senderId ? `"${senderId}"` : "❌ UNDEFINED"}`);
console.log(`   MYSMS_TEMPLATE_ID = ${templateId ? `"${templateId}"` : "❌ UNDEFINED"}`);
console.log("");

if (!apiKey || !clientId || !senderId || !templateId) {
  console.error("❌ Missing environment variables. Ensure .env is in the same directory.\n");
  process.exit(1);
}

// ─── Get phone number from command line ───
const phoneArg = process.argv[2];
if (!phoneArg) {
  console.error("Usage:  node manualSmsTest.js <10-digit-phone-number>");
  console.error("Example: node manualSmsTest.js 7019710774\n");
  process.exit(1);
}

// Clean to 10 digits
let phone = phoneArg.replace(/\D/g, "");
if (phone.length === 12 && phone.startsWith("91")) phone = phone.substring(2);
if (phone.length === 11 && phone.startsWith("0")) phone = phone.substring(1);
if (phone.length !== 10) {
  console.error(`❌ Invalid phone number: "${phoneArg}" → cleaned to "${phone}" (need exactly 10 digits)\n`);
  process.exit(1);
}

// Prefix with 91 as requested
const mobileNumber = `91${phone}`;

console.log(`📱 Target number: ${mobileNumber}\n`);

// ─── Define both message formats ───

// Test 1: SINGLE-LINE — Exactly matches DLT registered template
const messageSingleLine = `Dear User, your OTP for TRUOWNERS is ${TEST_OTP}. Do not share it with anyone. Team TRUOWNERS`;

// Test 2: MULTI-LINE — With line breaks
const messageMultiLine = `Dear User, your OTP for TRUOWNERS is ${TEST_OTP}.\nDo not share it with anyone.\nTeam TRUOWNERS`;

/**
 * Send a single test SMS and log everything.
 */
async function sendTestSMS(testName, message) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`   Message: ${JSON.stringify(message)}`);
  console.log(`   Message length: ${message.length} chars`);

  const params = new URLSearchParams({
    ApiKey: apiKey,
    ClientId: clientId,
    SenderId: senderId,
    Message: message,
    MobileNumbers: mobileNumber,
    Is_Unicode: "false",
    Is_Flash: "false",
    TemplateId: templateId,
  });

  const fullUrl = `${SMS_BASE_URL}?${params.toString()}`;

  console.log(`\n   📤 Full URL:\n   ${fullUrl}\n`);

  try {
    const response = await axios.get(fullUrl, { timeout: 30000 });

    console.log(`   📥 HTTP Status: ${response.status}`);
    console.log(`   📥 Response Body:`);
    console.log(JSON.stringify(response.data, null, 4));

    // Parse key fields if response is an object
    if (typeof response.data === "object" && response.data !== null) {
      const d = response.data;
      console.log(`\n   Summary:`);
      console.log(`     ErrorCode:               ${d.ErrorCode ?? "N/A"}`);
      console.log(`     ErrorMessage:             ${d.ErrorMessage ?? "N/A"}`);
      console.log(`     MessageErrorCode:         ${d.MessageErrorCode ?? "N/A"}`);
      console.log(`     MessageErrorDescription:  ${d.MessageErrorDescription ?? "N/A"}`);
      console.log(`     JobId:                    ${d.JobId ?? "N/A"}`);
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`   ❌ HTTP Error: ${error.response.status}`);
      console.error(`   Body:`, JSON.stringify(error.response.data, null, 4));
    } else if (error.code) {
      console.error(`   ❌ Network Error: ${error.code} — ${error.message}`);
    } else {
      console.error(`   ❌ Error: ${error.message}`);
    }
    return null;
  }
}

// ─── Run both tests sequentially ───
(async () => {
  console.log("🚀 Starting tests...\n");

  const result1 = await sendTestSMS(
    "TEST 1: Single-line message (exact DLT template match)",
    messageSingleLine
  );

  // Wait 3 seconds between tests to avoid rate limiting
  console.log("\n⏳ Waiting 3 seconds before next test...");
  await new Promise((r) => setTimeout(r, 3000));

  const result2 = await sendTestSMS(
    "TEST 2: Multi-line message (with \\n line breaks)",
    messageMultiLine
  );

  // ─── Final summary ───
  console.log(`\n${"═".repeat(50)}`);
  console.log("📊 RESULTS SUMMARY");
  console.log(`${"═".repeat(50)}`);
  console.log(`\n  Test 1 (Single-line): ${result1 ? `ErrorCode=${result1.ErrorCode}, Msg=${result1.MessageErrorDescription}` : "FAILED"}`);
  console.log(`  Test 2 (Multi-line):  ${result2 ? `ErrorCode=${result2.ErrorCode}, Msg=${result2.MessageErrorDescription}` : "FAILED"}`);
  console.log(`\n  👉 Check your phone (${mobileNumber}) for which message actually arrives.`);
  console.log(`  👉 If Test 1 arrives but Test 2 doesn't → DLT template mismatch was the issue.`);
  console.log(`  👉 If neither arrives → Issue is provider/telecom side.\n`);
})();
