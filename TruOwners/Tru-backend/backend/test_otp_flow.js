require("dotenv").config();
const { sendOTPEmail } = require("./services/emailService");

async function testOTPFlow() {
  const email = process.env.GMAIL_USER;
  console.log("Testing OTP flow with current logic...");
  try {
    const result = await sendOTPEmail(email, "123456", "test purpose");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testOTPFlow();
