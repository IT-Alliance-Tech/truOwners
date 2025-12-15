import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
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
        <ErrorOutlineIcon sx={{ fontSize: 80, color: "red" }} />
        <Typography variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
          Payment Failed!
        </Typography>
        <Typography
          variant="body1"
          sx={{ mt: 1, mb: 3, color: "text.secondary" }}
        >
          Something went wrong with your transaction. Please try again.
        </Typography>
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default ErrorPage;
