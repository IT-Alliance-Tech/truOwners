// src/components/common/SubscriptionBanner.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import './SubscriptionBanner.css';

const SubscriptionBanner = ({ variant = 'default' }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    try {
      // const token = localStorage.getItem('token'); // Use token from context
      const response = await fetch(buildApiUrl(API_CONFIG.SUBSCRIPTION.MY_SUBSCRIPTION), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setSubscription(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  // User not authenticated - show subscribe banner
  if (!isAuthenticated) {
    return (
      <div className="subscription-banner not-subscribed">
        <div className="banner-content">
          <div className="banner-icon">🔒</div>
          <div className="banner-text">
            <h3>Unlock Property Owner Details</h3>
            <p>Subscribe to view owner contact information and property details</p>
          </div>
          <button onClick={() => navigate('/subscription-plans')} className="banner-btn subscribe">
            View Plans
          </button>
        </div>
      </div>
    );
  }

  // User has no subscription
  if (!subscription) {
    return (
      <div className="subscription-banner not-subscribed">
        <div className="banner-content">
          <div className="banner-icon">✨</div>
          <div className="banner-text">
            <h3>Get Full Access to Property Details</h3>
            <p>Subscribe now to view owner contacts and unlock all property information</p>
          </div>
          <button onClick={() => navigate('/subscription-plans')} className="banner-btn subscribe">
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  // User has active subscription - show upgrade banner
  const daysRemaining = Math.ceil(
    (new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const creditsRemaining = subscription.plan.contactLimit - subscription.contactsViewed;
  const isLowCredits = creditsRemaining <= 2;
  const isExpiringSoon = daysRemaining <= 3;

  if (variant === 'compact') {
    return (
      <div className={`subscription-banner-compact ${isLowCredits || isExpiringSoon ? 'warning' : 'active'}`}>
        <div className="compact-content">
          <span className="plan-badge">{subscription.plan.name}</span>
          <span className="credits-info">
            {creditsRemaining} credits left • {daysRemaining} days
          </span>
          {(isLowCredits || isExpiringSoon) && (
            <button onClick={() => navigate('/subscription-plans')} className="upgrade-btn-small">
              Upgrade
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`subscription-banner subscribed ${isLowCredits || isExpiringSoon ? 'warning' : ''}`}>
      <div className="banner-content">
        <div className="banner-icon">
          {isLowCredits || isExpiringSoon ? '⚠️' : '✅'}
        </div>
        <div className="banner-text">
          <h3>
            {isLowCredits
              ? 'Running Low on Credits!'
              : isExpiringSoon
              ? 'Subscription Expiring Soon!'
              : `${subscription.plan.name} Active`}
          </h3>
          <p>
            {creditsRemaining} of {subscription.plan.contactLimit} contacts remaining • Expires in {daysRemaining} days
          </p>
        </div>
        <button onClick={() => navigate('/subscription-plans')} className="banner-btn upgrade">
          {isLowCredits || isExpiringSoon ? 'Upgrade Now' : 'Upgrade Plan'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
