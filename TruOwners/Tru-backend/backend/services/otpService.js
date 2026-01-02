const OTP = require("../models/OTP");
const { generateOTP } = require("../utils/helpers");

const generateAndSaveOTP = async (email, userData = null) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  const updateData = { otp, expiresAt };
  if (userData) updateData.userData = userData;

  await OTP.findOneAndUpdate({ email }, updateData, {
    upsert: true,
    new: true,
  });

  return otp;
};

const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) return false;

  const isValid = otpRecord.otp === otp && otpRecord.expiresAt > new Date();
  return isValid ? otpRecord : false;
};

module.exports = {
  generateAndSaveOTP,
  verifyOTP,
};
