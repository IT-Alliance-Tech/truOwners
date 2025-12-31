import React, { useState } from "react";
import "./ContactPage.css";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";
import { API_CONFIG, buildApiUrl } from "../../../config/api";
import { Snackbar, Alert } from "@mui/material";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    interestedIn: "OTHER",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.USER.INQUIRIES), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSnackbar({
          open: true,
          message: "Thank you! Your message has been sent successfully.",
          severity: "success",
        });
        setFormData({
          name: "",
          phone: "",
          email: "",
          message: "",
          interestedIn: "OTHER",
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || "Failed to send message.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setSnackbar({
        open: true,
        message: "Something went wrong. Please try again later.",
        severity: "error",
      });
    }
  };

  return (
    <div className="contact-page">
      {/* 1. Hero Section */}
      <section className="hero-contact">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you. Let's talk!</p>
      </section>

      {/* 2. Contact Form + Info */}
      <section className="contact-main">
        <div className="contact-info">
          <h1 className="head1">Get In Touch</h1>
          <ul>
            <li>
              <FaMapMarkerAlt className="icon" />
              <div>
                <h4>Address</h4>
                <p>
                  Ground floor no 100 corner shop 13th main 27th cross,28th B
                  cross 4th block,Jayanagar
                </p>
              </div>
            </li>
            <li>
              <FaPhoneAlt className="icon" />
              <div>
                <h4>Phone</h4>
                <p>+91 8867721812 </p>
              </div>
            </li>
            <li>
              <FaEnvelope className="icon" />
              <div>
                <h4>Email</h4>
                <p>Truowners@gmail.com</p>
              </div>
            </li>
            <li>
              <FaClock className="icon" />
              <div>
                <h4>Working Hours</h4>
                <p>Mon - Sat, 9:00 to 6:00</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="contact-form">
          <h1 className="head1">Contact Us</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <select
              name="interestedIn"
              value={formData.interestedIn}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            >
              <option value="OTHER">INTERESTED IN</option>
              <option value="SELL">SELL</option>
              <option value="RENT">RENT</option>
              <option value="LEASE">LEASE</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
            </select>
            <textarea
              name="message"
              placeholder="Your Message"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </section>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ContactPage;
