import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRupeeSign, FaMoneyBillWave } from "react-icons/fa";
import { SiPhonepe, SiPaytm } from "react-icons/si";
import { initiateRazorpayPayment } from "../../../config/razorpay/payments";
import "./PayNowButton.css";

const paymentMethods = [
  { name: "Razorpay", icon: <FaRupeeSign size={20} color="#007bff" /> },
  { name: "PhonePe", icon: <SiPhonepe size={20} color="#5f259f" /> },
  { name: "Paytm", icon: <SiPaytm size={20} color="#00baf2" /> },
];

const PayNowButton = ({ amount = 599, description = "Subscription Plan" }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("Razorpay");
  const navigate = useNavigate();

  const handlePayment = () => {
    setShowOptions(false);
    const method = selectedMethod;

    if (method === "Razorpay") {
      initiateRazorpayPayment({
        amount,
        name: description,
        description,
        callback: (response) => {
          if (response.razorpay_payment_id) {
            navigate("/subscription/success", {
              state: { planName: description, paymentId: response.razorpay_payment_id },
            });
          } else {
            navigate("/subscription/error", {
              state: { planName: description, error: response.error || "Payment failed" },
            });
          }
        },
      });
    } else {
      alert(`Redirecting to ${method} payment (demo)`);
    }
  };

  return (
    <div className="paynow-container">
      <button className="paynow-main-button" onClick={() => setShowOptions(true)}>
        Pay Now
      </button>

      {showOptions && (
        <div className="paynow-modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="paynow-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select Payment Method</h3>

            <form className="paynow-methods-form">
              {paymentMethods.map((method, index) => (
                <label key={index} className="paynow-method-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.name}
                    checked={selectedMethod === method.name}
                    onChange={() => setSelectedMethod(method.name)}
                  />
                  <div className="paynow-method-info">
                    {method.icon}
                    <span>{method.name}</span>
                  </div>
                </label>
              ))}
            </form>

            {/* 💰 Clean “Or pay via Cash” section */}
            <div className="paynow-cash-text">
              <div className="cash-line" />
              <div className="cash-content">
                <FaMoneyBillWave
                  size={18}
                  color="#28a745"
                  style={{ marginRight: "8px", verticalAlign: "middle" }}
                />
                <span>Or pay via <strong>Cash</strong></span>
              </div>
            </div>

            {/* ✅ Buttons side-by-side */}
            <div className="paynow-buttons">
              <button className="paynow-main-button" onClick={handlePayment}>
                Pay Now
              </button>
              <button className="paynow-close-button" onClick={() => setShowOptions(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayNowButton;
