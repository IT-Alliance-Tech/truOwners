const User = require("../models/User");
const OTP = require("../models/OTP");
const Owner = require("../models/Owner");
const UserSubscription = require("../models/UserSubscription");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../services/emailService");
const { sendOTPSMS } = require("../services/smsService");
const { generateAndSaveOTP, verifyOTP } = require("../services/otpService");
const { validateEmail } = require("../utils/helpers");
const { ROLES } = require("../utils/constants");

// Generate JWT Token
const generateToken = async (user) => {
  return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Normalize phone to 10-digit Indian format for consistent DB lookups
const normalizePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.substring(2);
  if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.substring(1);
  if (cleaned.length === 10) return cleaned;
  return null;
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

// In-memory SMS OTP storage (consider using MongoDB/Redis for production scaling)
const smsOTPStore = {};

// Generate 6-digit OTP
const generateSMSOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS OTP via MySMSMantra
const sendSMSOTP = async (req, res) => {
  const { phone } = req.body;

  try {
    // ─── Validate phone number ───
    if (!phone) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Phone number is required" },
        data: null,
      });
    }

    // Validate phone format before proceeding
    const cleanPhone = phone.replace(/\D/g, "");
    let tenDigitPhone = cleanPhone;
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      tenDigitPhone = cleanPhone.substring(2);
    }
    if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
      tenDigitPhone = cleanPhone.substring(1);
    }
    if (tenDigitPhone.length !== 10) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid phone number. Must be a 10-digit Indian mobile number." },
        data: null,
      });
    }

    // ─── Generate OTP ───
    const otp = generateSMSOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store in memory
    smsOTPStore[phone] = {
      otp,
      expiresAt,
      verified: false,
    };

    console.log(`\n📱 [SMS OTP] Generated OTP for ${phone}: ${otp}`);

    // ─── Send SMS via MySMSMantra ───
    const smsResult = await sendOTPSMS(phone, otp);

    if (!smsResult.success) {
      console.error(`❌ [SMS OTP] Failed to send SMS to ${phone}:`, smsResult.error);
      // Clean up OTP store on failure
      delete smsOTPStore[phone];
      return res.status(500).json({
        statusCode: 500,
        success: false,
        error: {
          message: "Failed to send OTP SMS. Please try again.",
          details: smsResult.error,
          providerResponse: smsResult.providerResponse || null,
        },
        data: null,
      });
    }

    console.log(`✅ [SMS OTP] SMS sent successfully to ${phone}`);

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
    console.error("❌ [SMS OTP] Unhandled error in sendSMSOTP:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
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

    console.log(`\n🔐 [SMS OTP Verify] Attempting verification for ${phone}`);

    // Check if OTP exists
    const otpRecord = smsOTPStore[phone];
    if (!otpRecord) {
      console.log(`❌ [SMS OTP Verify] No OTP record found for ${phone}`);
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "OTP not found or expired. Please request a new OTP." },
        data: null,
      });
    }

    // Check expiry
    if (Date.now() > otpRecord.expiresAt) {
      delete smsOTPStore[phone];
      console.log(`❌ [SMS OTP Verify] OTP expired for ${phone}`);
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "OTP expired. Please request a new OTP." },
        data: null,
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      console.log(`❌ [SMS OTP Verify] OTP mismatch for ${phone}: expected=${otpRecord.otp}, received=${otp}`);
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid OTP" },
        data: null,
      });
    }

    // Mark as verified and clean up
    otpRecord.verified = true;
    delete smsOTPStore[phone]; // Clean up after successful verification

    console.log(`✅ [SMS OTP Verify] OTP verified successfully for ${phone}`);

    // Normalize phone for consistent DB lookup
    const normalized = normalizePhone(phone);
    const phoneVariants = normalized
      ? [normalized, `91${normalized}`, `+91${normalized}`, phone]
      : [phone];

    // Find user by any phone format variant (single query)
    const user = await User.findOne({ phone: { $in: phoneVariants } });

    if (user) {
      // CASE A: Existing user — generate JWT and log them in
      const token = await generateToken(user);

      // Fetch active subscription
      const subscription = await UserSubscription.findOne({
        user: user._id,
        status: "active",
      }).populate("plan");

      let activeSubscription = null;
      if (subscription) {
        if (new Date() > subscription.endDate) {
          subscription.status = "expired";
          await subscription.save();
        } else {
          activeSubscription = subscription;
        }
      }

      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          message: "Login successful",
          token,
          profileRequired: false,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            isVerified: user.verified,
            subscription: activeSubscription,
          },
        },
      });
    }

    // CASE B: New user — phone verified but no account yet
    res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        message: "OTP verified. Please complete your profile to continue.",
        profileRequired: true,
        tempPhone: normalized || phone,
      },
    });
  } catch (error) {
    console.error("❌ [SMS OTP Verify] Unhandled error:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: "Internal server error", details: error.message },
      data: null,
    });
  }
};

// Complete profile for SMS-first registration (new user after OTP verify)
const completeProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    if (!name || !email || !phone) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Name, email, and phone are required" },
        data: null,
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid email format" },
        data: null,
      });
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Invalid phone number" },
        data: null,
      });
    }

    // Check if email already taken by a verified user
    const existingEmail = await User.findOne({ email, verified: true });
    if (existingEmail) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Email already in use" },
        data: null,
      });
    }

    // Check if phone already linked to an account
    const phoneVariants = [normalized, `91${normalized}`, `+91${normalized}`];
    const existingPhone = await User.findOne({ phone: { $in: phoneVariants } });
    if (existingPhone) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: "Phone number already linked to an account" },
        data: null,
      });
    }

    // Create user — phone-verified, no password needed
    const user = new User({
      name,
      email,
      phone: normalized,
      verified: true,
      role: ROLES.USER,
    });
    await user.save();

    const token = await generateToken(user);

    res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: {
        message: "Profile created successfully",
        token,
        profileRequired: false,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          isVerified: user.verified,
        },
      },
    });
  } catch (error) {
    console.error("Complete profile error:", error);
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
  completeProfile,
};
