export const initiateRazorpayPayment = ({ amount, name, description, callback }) => {
  if (!window.Razorpay) {
    alert("Razorpay SDK not loaded. Include it in public/index.html");
    return;
  }

  const options = {
    key: "rzp_test_YourTestKeyHere", // Your Razorpay Test Key ID
    amount: amount * 100, // amount in paise
    currency: "INR",
    name: name,
    description: description,
    handler: function (response) {
      callback(response);
    },
    prefill: {
      name: "John Doe",
      email: "demo@example.com",
      contact: "9999999999"
    },
    theme: {
      color: "#3498db"
    },
    modal: {
      ondismiss: function() {
        callback({ error: "Payment closed by user" });
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
