import React from "react";
import "./AboutPage.css";
import aboutImage from "/src/assets/images/who.jpg"; // Replace with your image
import infoImage from "/src/assets/images/villa.jpg"; // Replace with another image
import { FaCheckSquare } from "react-icons/fa";

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* 1. Hero Section */}
      <section className="about-hero">
        <h1>About TruOwner</h1>
        <p>Your trusted rental partner for hassle-free property experiences.</p>
      </section>

      {/* 2. Side-by-Side Image and Paragraph Section */}
      <section className="about-content">
        <div className="image-container">
          <img src={aboutImage} alt="About TruOwner" />
        </div>
        <div className="text-container">
          <h2 className="head2">Who We Are</h2>
          <p className="head2-para">
                TruOwners is a premier, broker-free platform designed to connect property owners and potential buyers/tenants directly. Sellers can easily register and post verified property listings on our site. Buyers can browse thousands of genuine ads, eliminating the need for intermediaries, and contact the owners directly to negotiate and finalize deals. To enhance the experience and unlock exclusive benefits, we offer users an optional TruOwners Premium subscription.
          </p>
        </div>
      </section>

      {/* 3. Why Brokerage Broken Section */}
      <section className="why-broken">
        <h2 className="head2">
          WHAT MAKES US <span className="broken">DIFFERENT</span>
        </h2>
        <div className="reasons">
          <div className="reason-card">
            <div className="emoji">📅</div>
            <h4 className="head21">Home that suit you</h4>
            <p>
              Find homes that match your lifestyle and needs, offering a personalized
              living experience designed.
            </p>
          </div>
          <div className="reason-card">
            <div className="emoji">🏷️</div>
            <h4 className="head21">Comfort essentials</h4>
            <p>
              Enjoy beautifully designed homes with essential amenities, smart layouts,
              and features that make daily living easy, relaxing, and comfortable.
            </p>
          </div>
          <div className="reason-card">
            <div className="emoji">💰</div>
            <h4 className="head21">Better Price</h4>
            <p>
              Get high-quality homes at competitive rates without compromising on
              design, comfort, or construction standards.
            </p>
          </div>
          <div className="reason-card">
            <div className="emoji">📜</div>
            <h4 className="head21">Agreement</h4>
            <p>
              Experience a smooth, transparent agreement process with complete legal
              support, ensuring clarity, trust, and peace of mind at every step.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Features/Values Section */}
      <section className="about-values">
        <div className="text-list">
          <ul>
            <li>
              <FaCheckSquare className="icon" />
              <strong className="left-side">Trust & Transparency:</strong> TruOwner eliminates
              common rental hassles like high brokerage.
            </li>
            <li>
              <FaCheckSquare className="icon" />
              <strong className="left-side">Experienced & Reliable:</strong> Backed by over 12 years
              of real estate expertise through <strong>Ganesh Gopal Krishna</strong>.
            </li>
            <li>
              <FaCheckSquare className="icon" />
              <strong className="left-side">Tailored, Verified Rentals:</strong> Homes curated to
              your needs — location, budget, size, and amenities — with every listing personally
              verified.
            </li>
            <li>
              <FaCheckSquare className="icon" />
              <strong className="left-side">Seamless Digital Process:</strong> Enjoy hassle-free
                  renting with digital paperwork and dedicated, end-to-end support.
            </li>
            <li>
              <FaCheckSquare className="icon" />
              <strong className="left-side">Customer-First & Eco-Friendly:</strong> We prioritize
              your comfort and promote sustainability.
            </li>
          </ul>
        </div>
        <div className="image-container">
          <img src={infoImage} alt="Our Values" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
