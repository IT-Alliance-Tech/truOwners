// src/components/pages/Profile/MySubscription.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_CONFIG, buildApiUrl } from "../../../config/api";
import "./MySubscription.css";

const MySubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [viewedProperties, setViewedProperties] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    fetchSubscriptionData();
    fetchPaymentHistory();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      // const token = localStorage.getItem("token"); // Use token from context
      
      // Fetch current subscription
      const subResponse = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.MY_SUBSCRIPTION), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subData = await subResponse.json();
      
      if (subData.success && subData.data) {
        setSubscription(subData.data);
      }

      // Fetch viewed properties
      const viewedResponse = await fetch(buildApiUrl(API_CONFIG.PROPERTY_VIEWS.VIEWED_PROPERTIES), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const viewedData = await viewedResponse.json();
      
      if (viewedData.success) {
        setViewedProperties(viewedData.data);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      // const token = localStorage.getItem("token"); // Use token from context
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.CANCEL), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert("Subscription cancelled successfully");
        fetchSubscriptionData();
      } else {
        alert(data.error?.message || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("An error occurred");
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.PAYMENT.HISTORY), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.data);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  if (loading) {
    return <div className="my-subscription-container">Loading...</div>;
  }

  if (!subscription) {
    return (
      <div className="my-subscription-container">
        <div className="no-subscription">
          <h2>No Active Subscription</h2>
          <p>You don't have an active subscription. Subscribe to view property owner details.</p>
          <button onClick={() => navigate("/subscription-plans")} className="subscribe-btn">
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = Math.ceil(
    (new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="my-subscription-container">
      <div className="subscription-header">
        <h1>My Subscription</h1>
      </div>

      <div className="subscription-card">
        <div className="subscription-info">
          <h2>{subscription.plan.name}</h2>
          <div className="subscription-details">
            <div className="detail-item">
              <span className="label">Contacts Viewed:</span>
              <span className="value">
                {subscription.contactsViewed} / {subscription.plan.contactLimit}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Days Remaining:</span>
              <span className="value">{daysRemaining > 0 ? daysRemaining : 0} days</span>
            </div>
            <div className="detail-item">
              <span className="label">Valid Until:</span>
              <span className="value">{new Date(subscription.endDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="subscription-actions">
            <button onClick={() => navigate("/subscription-plans")} className="upgrade-btn">
              Upgrade Plan
            </button>
            <button onClick={handleCancelSubscription} className="cancel-btn">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      <div className="payment-history-section">
        <h2>Payment History ({paymentHistory.length})</h2>
        {paymentHistory.length === 0 ? (
          <p className="no-payments">No payment history available.</p>
        ) : (
          <div className="payments-list">
            {paymentHistory.map((payment) => (
              <div key={payment._id} className="payment-card">
                <div className="payment-header">
                  <h3>{payment.plan?.name || "Subscription Plan"}</h3>
                  <span className={`payment-status ${payment.status}`}>
                    {payment.status.toUpperCase()}
                  </span>
                </div>
                <div className="payment-details">
                  <div className="payment-row">
                    <span className="label">Amount:</span>
                    <span className="value">₹{payment.amount}</span>
                  </div>
                  <div className="payment-row">
                    <span className="label">GST (18%):</span>
                    <span className="value">₹{payment.gstAmount}</span>
                  </div>
                  <div className="payment-row">
                    <span className="label">Total Amount:</span>
                    <span className="value total">₹{payment.totalAmount}</span>
                  </div>
                  <div className="payment-row">
                    <span className="label">Transaction ID:</span>
                    <span className="value transaction-id">
                      {payment.phonepeTransactionId || payment.merchantTransactionId}
                    </span>
                  </div>
                  <div className="payment-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="viewed-properties-section">
        <h2>Viewed Properties ({viewedProperties.length})</h2>
        {viewedProperties.length === 0 ? (
          <p className="no-properties">You haven't viewed any property details yet.</p>
        ) : (
          <div className="properties-grid">
  {viewedProperties.map((view) => (
    <div
      key={view._id}
      onClick={() => (window.location.href = `/property/${view.property._id}`)}
      className="property-card"
    >
      <div className="property-img">
        <img
          src={view.property?.images?.[0]}
          alt={view.property?.title}
        />
      </div>

      <div className="property-content">
        <h3>{view.property?.title || "Property"}</h3>

        <p className="property-location">
          {view.property?.location?.city}, {view.property?.location?.state}
        </p>

        <p className="property-rent">₹{view.property?.rent}/month</p>

        <p className="viewed-date">
          Viewed on: {new Date(view.viewedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  ))}
</div>

        )}
      </div>
    </div>
  );
};

export default MySubscription;
