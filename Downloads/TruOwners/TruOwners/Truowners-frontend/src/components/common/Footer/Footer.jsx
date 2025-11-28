import React from 'react'
import './Footer.css'
import { FaFacebookF, FaYoutube, FaWhatsapp, FaInstagram } from 'react-icons/fa'
import redlogo from "../../../assets/images/size-logo1.png";
import { Box, Typography } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";



 const iconStyle = { color: "#d32f2f", fontSize: "1.5rem" }; // Red icons

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Footer Left - Logo/Brand */}
          <div className="footer-left">
            <div className="footer-logo">
             
                <img src={redlogo} className='logo-image' style={{ width: "275px", height: "auto" }} />
               
              <p className="footer-tagline">Find your perfect rental home</p>
            </div>
          </div>

          {/* Footer Center - Useful Links */}
          <div className="footer-center">
            <h3 className="footer-title">Useful Links</h3>
            <ul className="footer-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/termcondition">Terms and Conditions</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          {/* Footer Right - Contact */}
          <div className="footer-right">
             <h3 className="footer-title">Contact</h3>
            

{/* <Box sx={{  color: "white" }}>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <PhoneIcon sx={iconStyle} />
        <Typography variant="body1" sx={{ ml: 1, fontSize: "15px" }}>
          +91 8095511561
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <EmailIcon sx={iconStyle} />
        <Typography variant="body1" sx={{ ml: 1,  fontSize: "15px" }}>
          gre71999@gmail.com
        </Typography>
      </Box>

      
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <HomeIcon sx={iconStyle} />
        <Typography variant="body1" sx={{ ml: 1 ,  fontSize: "15px"}}>
          Ground floor no 100 corner shop 13th main 27th cross,28th B cross 4th block,Jayanagar
        </Typography>
      </Box>
    </Box> */}

<Box
  sx={{
    color: "white",
    textAlign: { xs: "center", sm: "left" }, // Center on mobile, left on larger screens
  }}
>
  {/* Phone */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      mb: 2,
      justifyContent: { xs: "center", sm: "flex-start" }, // Center in mobile
    }}
  >
    <PhoneIcon sx={iconStyle} />
    <Typography variant="body1" sx={{ ml: 1, fontSize: "15px" }}>
      +91 8867721812
    </Typography>
  </Box>

  {/* Email */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      mb: 2,
      justifyContent: { xs: "center", sm: "flex-start" }, // Center in mobile
    }}
  >
    <EmailIcon sx={iconStyle} />
    <Typography variant="body1" sx={{ ml: 1, fontSize: "15px" }}>
     Truowners@gmail.com
    </Typography>
  </Box>

  {/* Address */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: { xs: "center", sm: "flex-start" }, // Center in mobile
    }}
  >
    <HomeIcon sx={iconStyle} />
    <Typography variant="body1" sx={{ ml: 1, fontSize: "15px" }}>
      Ground floor no 100 corner shop 13th main 27th cross,28th B cross 4th block,Jayanagar
    </Typography>
  </Box>
</Box>



          </div>


















        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 Truowners. All rights reserved.</p>
            <div className="footer-bottom-links">
              <p>Developed by <a href="https://www.italliance.tech" style={{ color: '#fff' }} >IT Alliance</a> </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
