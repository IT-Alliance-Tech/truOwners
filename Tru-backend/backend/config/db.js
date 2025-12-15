const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

// Check if the MongoDB connection string is set
if (!MONGO_URI) {
  console.error("MongoDB connection string is required");
  process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(MONGO_URI);

    // Log a success message to the console
    console.log("MongoDB Connected...");
  } catch (err) {
    // Log an error message to the console
    console.error("MongoDB Connection Error:", err);
    // Exit the process with a status code of 1
    process.exit(1);
  }
};

// Export the connectDB function
module.exports = connectDB;
