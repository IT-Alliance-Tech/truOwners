const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/helpers');

const generateAndSaveOTP = async (email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  
  await OTP.findOneAndUpdate(
    { email },
    { otp, expiresAt },
    { upsert: true, new: true }
  );
  
  return otp;
};

const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) return false;
  
  return otpRecord.otp === otp && otpRecord.expiresAt > new Date();
};

module.exports = {
  generateAndSaveOTP,
  verifyOTP
};