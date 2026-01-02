const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

async function sendMailHTTP({ to, subject, text, html, from }) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailUser = process.env.GMAIL_USER;

  if (!clientId || !clientSecret || !refreshToken || !gmailUser) {
    console.error(
      "❌ Gmail OAuth2 credentials missing in environment variables!"
    );
    throw new Error("Missing Gmail OAuth2 configuration");
  }

  const oAuth2Client = new OAuth2Client(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { token } = await oAuth2Client.getAccessToken();
    console.log(`Sending email to: ${to}`);

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
      "base64"
    )}?=`;
    const messageParts = [
      `From: ${from || gmailUser}\r\n`,
      `To: ${to}\r\n`,
      `Content-Type: text/html; charset=utf-8\r\n`,
      `MIME-Version: 1.0\r\n`,
      `Subject: ${utf8Subject}\r\n\r\n`,
      html || text,
    ];
    const message = messageParts.join("");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await axios.post(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      { raw: encodedMessage },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Gmail API Response:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Gmail API Send Error:",
      error.response
        ? JSON.stringify(error.response.data, null, 2)
        : error.message
    );
    throw error;
  }
}

module.exports = { sendMailHTTP };
