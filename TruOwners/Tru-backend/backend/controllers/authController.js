const User = require("../models/User");
const OTP = require("../models/OTP");
const Owner = require("../models/Owner");
const UserSubscription = require("../models/UserSubscription");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { sendOTPEmail } = require("../services/emailService");
const { generateAndSaveOTP, verifyOTP } = require("../services/otpService");
const { validateEmail } = require("../utils/helpers");
const { ROLES } = require("../utils/constants");

// Generate JWT Token
const generateToken = async (user) => {
  return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register user
const register = async (req, res) => {
  const {
    firstName,
    lastName,
    name,
    email,
    password,
    phone,
    role,
    idProofNumber,
    idProofType,
    idProofImageUrl,
  } = req.body;

  try {
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid email format" },
        data: null,
      });
    }

    // Check if a VERIFIED user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.verified) {
      return res.status(400).json({
        success: false,
        error: { message: "Email already in use" },
        data: null,
      });
    }

    // Validate ID proof for owner
    if (role === ROLES.OWNER) {
      if (!idProofNumber || !idProofType || !idProofImageUrl) {
        return res.status(400).json({
          success: false,
          error: { message: "Owner registration requires ID proof details" },
          data: null,
        });
      }
    }

    // Prepare registration data to be saved with OTP
    const registrationData = {
      firstName,
      lastName,
      name: name || `${firstName || ""} ${lastName || ""}`.trim(),
      email,
      phone,
      password,
      role: role || ROLES.USER,
    };

    if (role === ROLES.OWNER) {
      registrationData.ownerProfile = {
        idProofNumber,
        idProofType,
        idProofImageUrl,
      };
    }

    // Generate and save OTP with registration data
    const otp = await generateAndSaveOTP(email, registrationData);

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error(
        "Failed to send OTP email during registration:",
        emailError
      );
      return res.status(500).json({
        success: false,
        error: {
          message:
            "Could not send verification email. Please check server configuration.",
          details: emailError.message,
        },
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      error: null,
      data: {
        message:
          "OTP sent successfully. Please verify to complete registration.",
        email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Update User
const updateUser = async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { id, firstName, lastName, name, phone, password } = req.body;

  try {
    // ✅ Check if the request is trying to update the same logged-in user
    if (id && id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: "You are not authorized to update this user" },
        data: null,
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = password; // will be hashed by pre-save hook

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      error: null,
      data: {
        message: "User updated successfully",
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          name: updatedUser.name,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isVerified: updatedUser.verified,
        },
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
    });
  }
};

// Validate OTP after registration
const validateOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Verify OTP
    const otpRecord = await verifyOTP(email, otp);
    if (!otpRecord) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid or expired OTP",
        },
        data: null,
      });
    }

    let user;

    // Check if this is a registration flow (has userData)
    if (otpRecord.userData) {
      const { ownerProfile, ...userData } = otpRecord.userData;

      // Final check for verified user
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.verified) {
        return res.status(400).json({
          success: false,
          error: { message: "Email already verified and in use" },
          data: null,
        });
      }

      if (existingUser) {
        // Update existing unverified user
        Object.assign(existingUser, userData);
        existingUser.verified = true;
        user = await existingUser.save();
      } else {
        // Create new user
        user = new User({ ...userData, verified: true });
        await user.save();
      }

      // Handle owner profile if needed
      if (user.role === ROLES.OWNER && ownerProfile) {
        const existingOwner = await Owner.findOne({ user: user._id });
        if (existingOwner) {
          Object.assign(existingOwner, ownerProfile);
          await existingOwner.save();
        } else {
          const owner = new Owner({
            user: user._id,
            ...ownerProfile,
            properties: [],
            verified: false,
          });
          await owner.save();
        }
      }

      // Clear registration data from OTP record
      otpRecord.userData = undefined;
      await otpRecord.save();
    } else {
      // Normal OTP verification (login, etc)
      user = await User.findOneAndUpdate(
        { email },
        { verified: true },
        { new: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: {
          message: "User account not found",
        },
        data: null,
      });
    }

    // Generate token after verification
    const token = await generateToken(user);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Email verified successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          isVerified: user.verified,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Login with password
const loginWithPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid credentials",
        },
        data: null,
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: {
          message: "Email not verified",
        },
        data: {
          user: {
            id: user._id,
            email: user.email,
            isVerified: user.verified,
          },
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid credentials",
        },
        data: null,
      });
    }

    const token = await generateToken(user);

    // Fetch active subscription
    const subscription = await UserSubscription.findOne({
      user: user._id,
      status: "active",
    }).populate("plan");

    // Check expiry if subscription exists
    let activeSubscription = null;
    if (subscription) {
      if (new Date() > subscription.endDate) {
        subscription.status = "expired";
        await subscription.save();
      } else {
        activeSubscription = subscription;
      }
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.verified,
          subscription: activeSubscription,
        },
      },
    });
  } catch (error) {
    console.error("Login with password error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Login with OTP
const loginWithOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "User not found",
        },
        data: null,
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: {
          message: "Email not verified",
        },
        data: {
          user: {
            id: user._id,
            email: user.email,
            isVerified: user.verified,
          },
        },
      });
    }

    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "Invalid or expired OTP",
        },
        data: null,
      });
    }

    const token = await generateToken(user._id);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.verified,
        },
      },
    });
  } catch (error) {
    console.error("Login with OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Send OTP
const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: {
          message: "User not found",
        },
        data: null,
      });
    }

    const otp = await generateAndSaveOTP(email);
    await sendOTPEmail(email, otp);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "OTP sent successfully",
        user: {
          id: user._id,
          email: user.email,
          isVerified: user.verified,
        },
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: {
        message: "Internal server error",
        details: error.message,
      },
      data: null,
    });
  }
};

// Step 1: Request password reset OTP
const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "User not found" },
        data: null,
      });
    }

    const otp = await generateAndSaveOTP(email);
    await sendOTPEmail(email, otp);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Password reset OTP sent successfully" },
    });
  } catch (error) {
    console.error("Forgot password request error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Step 2: Verify OTP for password reset
const verifyForgotPasswordOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "User not found" },
        data: null,
      });
    }

    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid or expired OTP" },
        data: null,
      });
    }

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "OTP verified successfully" },
    });
  } catch (error) {
    console.error("Verify forgot password OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Step 3: Reset password using OTP
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: "User not found" },
        data: null,
      });
    }

    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid or expired OTP" },
        data: null,
      });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: "Password reset successfully" },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const requesterRole = req.user.role; // role comes from auth middleware
  const { userId } = req.body; // admin specifies which user to delete

  try {
    // Check if the logged-in user is admin
    if (requesterRole !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied. Only admins can delete users." },
        data: null,
      });
    }

    // Delete target user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" },
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      error: null,
      data: { message: "User deleted successfully", deletedUserId: userId },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// In-memory SMS OTP storage
const smsOTPStore = {};

// Generate 6-digit OTP
const generateSMSOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Real SMS API Helper with Enhanced Debugging
const sendRealSMS = async (phone, message) => {
  try {
    const apiKey = process.env.MYSMS_API_KEY;
    const clientId = process.env.MYSMS_CLIENT_ID;
    const senderId = process.env.MYSMS_SENDER_ID;
    const templateId = process.env.MYSMS_TEMPLATE_ID;

    if (!apiKey || !clientId || !senderId || !templateId) {
      throw new Error("SMS API credentials not configured. Check MYSMS_API_KEY, MYSMS_CLIENT_ID, MYSMS_SENDER_ID, MYSMS_TEMPLATE_ID in .env");
    }

    if (templateId === "YOUR_DLT_TEMPLATE_ID_HERE" || !/^\d+$/.test(templateId)) {
      throw new Error("DLT Template ID not configured properly. MYSMS_TEMPLATE_ID must be a valid numeric DLT template ID, not a placeholder.");
    }

    // Validate and format mobile number
    let formattedPhone = phone.replace(/\+/g, "").trim();

    // Add country code if not present
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    // Validate Indian phone number format
    if (!/^91\d{10}$/.test(formattedPhone)) {
      throw new Error(
        `Invalid phone number format: ${phone}. Expected 10 digit Indian number or 91XXXXXXXXXX`
      );
    }

    console.log(`\n📱 SMS SEND ATTEMPT:`);
    console.log(`   Original Phone: ${phone}`);
    console.log(`   Formatted Phone: ${formattedPhone}`);
    console.log(`   Sender ID: ${senderId}`);
    console.log(`   Template ID: ${templateId}`);
    console.log(`   Message Length: ${message.length} chars`);
    console.log(`   Message Content: ${message}`);

    const apiUrl = "https://api.mylogin.co.in/api/v2/SendSMS";

    const requestParams = {
      ApiKey: apiKey,
      ClientId: clientId,
      SenderId: senderId,
      Message: message,
      MobileNumbers: formattedPhone,
      Is_Unicode: "false",
      Is_Flash: "false",
      TemplateId: templateId,
    };

    // Log request URL with masked API key for debugging
    const maskedParams = { ...requestParams, ApiKey: requestParams.ApiKey.substring(0, 6) + "...MASKED" };
    console.log(`   API Endpoint: ${apiUrl}`);
    console.log(`   Request Params:`, JSON.stringify(maskedParams, null, 2));

    const response = await axios.get(apiUrl, {
      params: requestParams,
      timeout: 10000,
    });

    console.log(`\n📨 API RESPONSE:`);
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Response Data:`, JSON.stringify(response.data, null, 2));

    // Check response structure
    if (!response.data) {
      throw new Error("Empty response from SMS API");
    }

    const data = response.data;

    // Handle MySMS (mylogin.co.in) API response format:
    // Success: { ErrorCode: 0, ErrorDescription: null, Data: [{ MessageErrorCode: 0, MessageErrorDescription: "Success", ... }] }
    // Error:   { ErrorCode: non-zero, ErrorDescription: "...", Data: null }

    // Check top-level API error
    if (data.ErrorCode !== undefined && data.ErrorCode !== 0) {
      const errMsg = data.ErrorDescription || data.ErrorMessage || "Unknown API error";
      console.error(`   ❌ API Error (ErrorCode: ${data.ErrorCode}): ${errMsg}`);
      throw new Error(`SMS API Error (Code ${data.ErrorCode}): ${errMsg}`);
    }

    // Check per-message delivery status in Data array
    if (data.Data && Array.isArray(data.Data) && data.Data.length > 0) {
      const msgResult = data.Data[0];

      if (msgResult.MessageErrorCode === 0 && msgResult.MessageErrorDescription === "Success") {
        console.log(`\n✅ SMS SENT SUCCESSFULLY:`);
        console.log(`   Message ID: ${msgResult.MessageId || "N/A"}`);
        console.log(`   Phone: ${msgResult.MobileNumber || formattedPhone}`);
        console.log(`   Status: ${msgResult.MessageErrorDescription}`);
        return { success: true, data: response.data };
      } else {
        console.error(`   ❌ Message Delivery Error (Code: ${msgResult.MessageErrorCode}): ${msgResult.MessageErrorDescription}`);
        throw new Error(`SMS delivery failed (Code ${msgResult.MessageErrorCode}): ${msgResult.MessageErrorDescription}`);
      }
    }

    // Fallback: Check legacy response fields for older API versions
    if (data.ErrorMessage) {
      console.error(`   ❌ API Error Message: ${data.ErrorMessage}`);
      throw new Error(`API Error: ${data.ErrorMessage}`);
    }

    if (data.StatusCode === "0" || data.Status === "Success") {
      console.log(`\n✅ SMS SENT SUCCESSFULLY (legacy format):`);
      console.log(`   Status: ${data.Status}`);
      console.log(`   Message ID: ${data.MessageId || data.JobId || "N/A"}`);
      console.log(`   Phone: ${formattedPhone}`);
      return { success: true, data: response.data };
    }

    // If we reach here, response format is unknown
    console.warn(`   ⚠️  Unrecognized Response Format: ${JSON.stringify(data)}`);
    // Don't silently succeed — treat unrecognized as failure
    throw new Error(`SMS API returned unrecognized response format: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error(`\n❌ SMS API ERROR:`);
    console.error(`   Phone: ${phone}`);
    console.error(`   Error Type: ${error.response?.status || error.code || "Network Error"}`);
    console.error(`   Error Message: ${error.message}`);
    if (error.response?.data) {
      console.error(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// Send SMS OTP
const sendSMSOTP = async (req, res) => {
  const { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Phone number is required" },
        data: null,
      });
    }

    // Generate OTP
    const otp = generateSMSOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store in memory
    smsOTPStore[phone] = {
      otp,
      expiresAt,
      verified: false,
    };

    // Send real SMS — message MUST exactly match approved DLT template
    // DLT Template: "Dear User, your OTP for TRUOWNERS is {#numeric#}. Do not share it with anyone. Team TRUOWNERS"
    const message = `Dear User, your OTP for TRUOWNERS is ${otp}. Do not share it with anyone. Team TRUOWNERS`;
    await sendRealSMS(phone, message);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "OTP sent successfully",
        phone,
      },
    });
  } catch (error) {
    console.error("Send SMS OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Failed to send SMS OTP", details: error.message },
      data: null,
    });
  }
};

// Verify SMS OTP
const verifySMSOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    if (!phone || !otp) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Phone number and OTP are required" },
        data: null,
      });
    }

    // Check if OTP exists
    const otpRecord = smsOTPStore[phone];
    if (!otpRecord) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "OTP not found or expired" },
        data: null,
      });
    }

    // Check expiry
    if (Date.now() > otpRecord.expiresAt) {
      delete smsOTPStore[phone];
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "OTP expired" },
        data: null,
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid OTP" },
        data: null,
      });
    }

    // Mark as verified
    otpRecord.verified = true;

    console.log(`✅ SMS OTP VERIFIED → Phone: ${phone}`);

    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "OTP verified successfully",
        phone,
        verified: true,
      },
    });
  } catch (error) {
    console.error("Verify SMS OTP error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

module.exports = {
  register,
  validateOTP,
  loginWithPassword,
  loginWithOTP,
  sendOTP,
  forgotPasswordRequest,
  verifyForgotPasswordOTP,
  resetPassword,
  updateUser,
  deleteUser,
  sendSMSOTP,
  verifySMSOTP,
};
