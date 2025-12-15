import React from "react";
import { Box, Typography, Button } from "@mui/material";
// import './SearchAds.css'
import aprtmentImg from '../../../assets/images/apartment.jpg'

const SearchAds = () => {
  return (
      <Box
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: 2,
        textAlign: "center",
        background: "#f9f9f9",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Apartment in Bengaluru
      </Typography>
      <img
        src={aprtmentImg}
        alt="Property Ad"
        style={{ width: "100%", borderRadius: "6px", marginBottom: "12px" }}
      />
      <Button variant="contained" color="primary">
        View
      </Button>
    </Box>
  )
}

export default SearchAds