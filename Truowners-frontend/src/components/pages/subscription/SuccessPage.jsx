import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "green" }} />
        <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
          Payment Successful!
        </Typography>
        <Typography
          variant="body1"
          sx={{ mt: 1, mb: 3, color: "text.secondary" }}
        >
          Thank you! Your payment has been completed successfully.
        </Typography>
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default SuccessPage;
