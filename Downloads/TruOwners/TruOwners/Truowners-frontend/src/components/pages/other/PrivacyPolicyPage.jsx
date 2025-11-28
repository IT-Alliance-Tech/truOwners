import React from 'react';
import './PrivacyPolicyPage.css';

const PrivacyPolicy = () => {
  return (
    <div className="terms-container">
      {/* Section 1: Banner */}
      <section className="terms-banner">
        <h1>Privacy Policy</h1>
      </section>

      {/* Section 2: Content */}
      <section className="terms-content">
        <p className="updated-date">Last Updated on 1 November, 2025</p>

        <p className="highlight">
          PLEASE READ THIS PRIVACY POLICY CAREFULLY. BY USING THE TRUOWNERS WEBSITE OR MOBILE PLATFORM, 
          YOU INDICATE THAT YOU UNDERSTAND, AGREE, AND CONSENT TO THIS PRIVACY POLICY.
        </p>

        <h2 className="padd">Introduction</h2>
        <p>
          TRUOWNERS (“we”, “our”, “us”) respects your privacy and is committed to protecting your 
          personal data. This Privacy Policy explains how we collect, use, and safeguard your information 
          when you access our website, create an account, list or view properties, or use any related 
          services.
        </p>

        <h2 className="padd">Information We Collect</h2>
        <ul>
          <li><strong>Personal Information:</strong> Name, email address, phone number, and address when you register or list a property.</li>
          <li><strong>Property Details:</strong> Information you provide while creating listings such as property images, location, price, and description.</li>
          <li><strong>Transaction Data:</strong> Details related to subscription payments or plan purchases through our payment gateway partners.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage logs collected automatically for analytics and security.</li>
        </ul>

        <h2 className="padd">How We Use Your Information</h2>
        <p>We may use your data for the following purposes:</p>
        <ul>
          <li>To verify and manage owner and property listings.</li>
          <li>To process subscriptions and payment transactions securely.</li>
          <li>To respond to inquiries and provide customer support.</li>
          <li>To send updates, alerts, and promotional content (only with your consent).</li>
          <li>To improve our platform’s user experience and functionality.</li>
        </ul>

        <h2 className="padd">Sharing & Disclosure</h2>
        <p>
          We do not sell your personal information. Your information may be shared only with:
        </p>
        <ul>
          <li>Authorized payment gateway providers for transaction processing.</li>
          <li>Trusted service providers assisting with hosting, analytics, or communication.</li>
          <li>Legal or regulatory authorities when required by law.</li>
        </ul>

        <h2 className="padd">Data Security</h2>
        <p>
          TRUOWNERS implements industry-standard security measures to protect your data. However, 
          no platform can guarantee complete security. Users are responsible for maintaining 
          the confidentiality of their login credentials.
        </p>

        <h2 className="padd">Cookies & Tracking</h2>
        <p>
          We use cookies to improve site performance and personalize your experience. 
          You may disable cookies through your browser settings, but some features may not work as intended.
        </p>

        <h2 className="padd">Third-Party Links</h2>
        <p>
          Our website may include links to third-party websites or integrations (e.g., payment processors). 
          TRUOWNERS is not responsible for their content or privacy practices. Please review their respective 
          privacy policies.
        </p>

        <h2 className="padd">Your Rights</h2>
        <ul>
          <li>  Access, correct, or update your personal information.</li>
          <li>  Request deletion of your account or data (subject to legal or contractual obligations).</li>
          <li>  Withdraw consent for marketing communications at any time.</li>
        </ul>

        <h2 className="padd">Contact Us</h2>
        <p>
          If you have any questions or concerns about this Privacy Policy or how your information 
          is handled, please contact us at:  
          <br />
          <strong>Email:</strong> Truowners@gmail.com
          <br />
          <strong>Address:</strong> Ground floor no 100 corner shop 13th main 27th cross,28th B cross 4th block,Jayanagar
        </p>

        <h2 className="padd">Policy Updates</h2>
        <p>
          This Privacy Policy may be updated periodically. We encourage users to review this page 
          regularly to stay informed about any changes.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
