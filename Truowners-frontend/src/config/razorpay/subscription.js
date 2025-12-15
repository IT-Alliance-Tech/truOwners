import React from 'react';

const SubscriptionPage = () => {

  const subscribe = () => {
    // Use your pre-created Plan ID from Razorpay
    const planId = 'plan_XXXXXXXXXXXX';

    const options = {
      key: 'YOUR_RAZORPAY_KEY_ID', // Razorpay Test Key
      subscription_id: planId,
      name: 'TruOwners',
      description: 'Premium Subscription',
      image: 'https://yourwebsite.com/logo.png',
      prefill: {
        name: 'John Doe',
        email: 'john@example.com',
        contact: '9999999999'
      },
      notes: {
        plan_name: 'Premium Plan'
      },
      theme: {
        color: '#0c6cf2'
      },
      handler: function(response){
        // Payment success callback
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
      },
      modal: {
        escape: true,
        ondismiss: function() {
          alert('Payment popup closed');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Subscribe to Premium Plan</h1>
      <p>Get unlimited access to all features</p>
      <button 
        onClick={subscribe} 
        style={{ padding: '1rem 2rem', background: '#0c6cf2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Subscribe Now
      </button>
    </div>
  );
};

export default SubscriptionPage;
