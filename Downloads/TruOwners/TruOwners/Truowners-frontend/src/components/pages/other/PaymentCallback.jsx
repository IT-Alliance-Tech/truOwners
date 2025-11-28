// src/components/pages/other/PaymentCallback.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { API_CONFIG, buildApiUrl } from "../../../config/api";
import "./PaymentCallback.css";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState("checking"); // checking, success, failed
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const merchantTransactionId = searchParams.get("merchantTransactionId");
    
    if (!merchantTransactionId) {
      setPaymentStatus("failed");
      setError("Invalid payment reference");
      return;
    }

    checkPaymentStatus(merchantTransactionId);
  }, [searchParams]);

  const checkPaymentStatus = async (merchantTransactionId) => {
    try {
      const response = await fetch(
        buildApiUrl(`${API_CONFIG.PAYMENT.STATUS}/${merchantTransactionId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPaymentDetails(data.data);
        
        if (data.data.payment.status === "success") {
          setPaymentStatus("success");
        } else if (data.data.payment.status === "failed") {
          setPaymentStatus("failed");
          setError("Payment was not successful");
        } else if (data.data.payment.status === "pending") {
          // Still pending, check again after a delay
          setTimeout(() => checkPaymentStatus(merchantTransactionId), 3000);
        }
      } else {
        setPaymentStatus("failed");
        setError(data.error?.message || "Failed to verify payment");
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setPaymentStatus("failed");
      setError("An error occurred while verifying payment");
    }
  };

  const handleContinue = () => {
    if (paymentStatus === "success") {
      navigate("/my-subscription");
    } else {
      navigate("/subscription-plans");
    }
  };

  return (
    <div className="payment-callback-container">
      <div className="payment-callback-card">
        {paymentStatus === "checking" && (
          <div className="payment-checking">
            <div className="payment-loader"></div>
            <h2>Verifying Payment</h2>
            <p>Please wait while we confirm your payment...</p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="payment-success">
            <div className="success-icon">
              <svg viewBox="0 0 52 52" className="checkmark">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2>Payment Successful!</h2>
            <p>Your subscription has been activated successfully.</p>
            
            {paymentDetails && (
              <div className="payment-info">
                <div className="info-row">
                  <span className="label">Plan:</span>
                  <span className="value">{paymentDetails.subscription?.plan?.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Amount Paid:</span>
                  <span className="value">₹{paymentDetails.payment.totalAmount}</span>
                </div>
                <div className="info-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value transaction-id">
                    {paymentDetails.payment.phonepeTransactionId || paymentDetails.payment.merchantTransactionId}
                  </span>
                </div>
              </div>
            )}

            <button className="continue-btn success-btn" onClick={handleContinue}>
              View My Subscription
            </button>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="payment-failed">
            <div className="failed-icon">
              <svg viewBox="0 0 52 52" className="crossmark">
                <circle className="crossmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="crossmark-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
              </svg>
            </div>
            <h2>Payment Failed</h2>
            <p>{error || "Your payment could not be processed."}</p>
            
            {paymentDetails && (
              <div className="payment-info">
                <div className="info-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value transaction-id">
                    {paymentDetails.payment.merchantTransactionId}
                  </span>
                </div>
              </div>
            )}

            <button className="continue-btn failed-btn" onClick={handleContinue}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
