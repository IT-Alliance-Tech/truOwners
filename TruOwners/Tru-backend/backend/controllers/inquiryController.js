const Inquiry = require("../models/Inquiry");

// @desc    Create new inquiry
// @route   POST /api/user/inquiries
// @access  Public
exports.createInquiry = async (req, res) => {
  try {
    const { name, email, phone, message, interestedIn } = req.body;

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      message,
      interestedIn: interestedIn || "OTHER",
    });

    res.status(201).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Inquiry creation error:", error);
    res.status(400).json({
      success: false,
      error: {
        message: "Failed to create inquiry",
        details: error.message,
      },
    });
  }
};

// @desc    Get all inquiries
// @route   GET /api/admin/inquiries
// @access  Private/Admin
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.error("Get all inquiries error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Server Error",
        details: error.message,
      },
    });
  }
};

// @desc    Update inquiry status
// @route   PATCH /api/admin/inquiries/:id/status
// @access  Private/Admin
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Inquiry not found",
          details: `No inquiry record exists for ID: ${req.params.id}`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error("Update inquiry status error:", error);
    res.status(400).json({
      success: false,
      error: {
        message: "Failed to update inquiry status",
        details: error.message,
      },
    });
  }
};

module.exports = {
  createInquiry: exports.createInquiry,
  getAllInquiries: exports.getAllInquiries,
  updateInquiryStatus: exports.updateInquiryStatus,
};
