// src/components/pages/other/SubscriptionPlans.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_CONFIG, buildApiUrl } from "../../../config/api";
import "./SubscriptionPlans.css";

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subscribing, setSubscribing] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.PLANS));
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      // const token = localStorage.getItem("token"); // Use token from context
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.MY_SUBSCRIPTION), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCurrentSubscription(data.data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      // Save current path to redirect back after login
      localStorage.setItem('redirectAfterLogin', '/subscription-plans');
      navigate("/login");
      return;
    }

    setSubscribing(plan._id);
    try {
      // Initiate payment through PhonePe
      const response = await fetch(buildApiUrl(API_CONFIG.PAYMENT.INITIATE), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan._id }),
      });

      const data = await response.json();
      
      if (data.success && data.data.paymentUrl) {
        // Redirect to PhonePe payment page
        window.location.href = data.data.paymentUrl;
      } else {
        alert(data.error?.message || "Failed to initiate payment");
        setSubscribing(null);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      alert("An error occurred while initiating payment");
      setSubscribing(null);
    }
  };

  const getPlanStyle = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes("silver")) {
      return {
        theme: "silver",
        icon: "🥈",
        gradient: "linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)",
        accent: "#7f8c8d",
        shadow: "0 10px 30px rgba(189, 195, 199, 0.4)"
      };
    }
    if (name.includes("gold")) {
      return {
        theme: "gold",
        icon: "👑",
        gradient: "linear-gradient(135deg, #FFF6B7 0%, #F6416C 100%)", // Richer gold/pink gradient
        accent: "#d35400",
        shadow: "0 10px 30px rgba(243, 156, 18, 0.4)"
      };
    }
    if (name.includes("diamond")) {
      return {
        theme: "diamond",
        icon: "💎",
        gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", // Premium holographic feel
        accent: "#8e44ad",
        shadow: "0 10px 30px rgba(142, 68, 173, 0.4)"
      };
    }
    return {
      theme: "default",
      icon: "✨",
      gradient: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      accent: "#34495e",
      shadow: "0 10px 30px rgba(0,0,0,0.1)"
    };
  };

  if (loading) {
    return (
      <div className="subscription-page-loading">
        <div className="loader"></div>
        <p>Loading premium plans...</p>
      </div>
    );
  }

  return (
    <div className="subscription-page-container">
      {/* Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="subscription-content-wrapper">
        {/* Header */}
        <div className="subscription-header-section">
          <h1 className="main-title">Unlock Your Dream Home</h1>
          <p className="sub-title">
            Get direct access to verified property owners. No middlemen, no hidden fees.
          </p>
          
          {currentSubscription && (
            <div className="active-subscription-banner">
              <div className="active-sub-content">
                <span className="status-dot"></span>
                <span className="active-text">
                  Active Plan: <strong>{currentSubscription.plan.name}</strong>
                </span>
                <span className="active-details">
                  {currentSubscription.contactsViewed}/{currentSubscription.plan.contactLimit} contacts used
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="plans-display-grid">
          {plans.map((plan) => {
            const style = getPlanStyle(plan.name);
            const isCurrent = currentSubscription?.plan._id === plan._id;
            const isPopular = plan.name.toLowerCase().includes("gold");

            return (
              <div 
                key={plan._id} 
                className={`premium-plan-card ${isPopular ? 'popular-card' : ''} ${isCurrent ? 'current-card' : ''}`}
              >
                {isPopular && <div className="popular-tag">Most Popular</div>}
                {isCurrent && <div className="current-tag">Active</div>}

                <div className="card-header" style={{ background: style.gradient }}>
                  <div className="plan-icon">{style.icon}</div>
                  <h2 className="plan-title" style={{ color: style.accent }}>{plan.name}</h2>
                  <div className="plan-price-container">
                    <span className="currency">₹</span>
                    <span className="price">{plan.price}</span>
                    <span className="gst-text">+18% GST</span>
                  </div>
                </div>

                <div className="card-body">
                  <ul className="features-list">
                    <li>
                      <span className="check-icon">✓</span>
                      <strong>{plan.contactLimit}</strong> Verified Contacts
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      <strong>{plan.validityDays} Days</strong> Validity
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      Direct Owner Access
                    </li>
                    <li>
                      <span className="check-icon">✓</span>
                      Premium Support
                    </li>
                  </ul>

                  <button
                    className={`action-button ${isCurrent ? 'disabled' : ''}`}
                    style={{ 
                      background: isCurrent ? '#ccc' : style.accent,
                      boxShadow: isCurrent ? 'none' : style.shadow 
                    }}
                    onClick={() => !isCurrent && handleSubscribe(plan)}
                    disabled={subscribing === plan._id || isCurrent}
                  >
                    {subscribing === plan._id ? (
                      <span className="loading-dots">Processing...</span>
                    ) : isCurrent ? (
                      "Currently Active"
                    ) : currentSubscription ? (
                      "Upgrade Plan"
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="trust-section">
          <div className="trust-item">
            <span className="trust-icon">🛡️</span>
            <span>100% Verified Owners</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>Secure Payments</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">⚡</span>
            <span>Instant Access</span>
          </div>
        </div>

        <div className="tnc-trigger">
          <p onClick={() => setShowModal(true)}>Terms & Conditions Apply</p>
        </div>
      </div>

      {/* T&C Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            <h3>Terms & Conditions</h3>
            <div className="modal-body">
              <p>1. Plans are valid for the specified duration only.</p>
              <p>2. Contact credits are deducted only for unique property views.</p>
              <p>3. Subscription fees are non-refundable.</p>
              <p>4. TruOwners reserves the right to modify plan benefits.</p>
              <Link to="/termcondition" className="full-tnc-link">Read Full Terms</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
