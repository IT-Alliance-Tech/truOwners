const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
module.exports = {
generateOTP,
validateEmail
};