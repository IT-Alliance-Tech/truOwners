const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const user = process.env.GMAIL_USER;

const oAuth2Client = new OAuth2Client(clientId, clientSecret);
oAuth2Client.setCredentials({ refresh_token: refreshToken });

async function sendMailHTTP({ to, subject, text, html, from }) {
  try {
    const { token } = await oAuth2Client.getAccessToken();

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString(
      "base64"
    )}?=`;
    const messageParts = [
      `From: ${from || user}`,
      `To: ${to}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      `Subject: ${utf8Subject}`,
      "",
      html || text,
    ];
    const message = messageParts.join("\n");

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

    return res.data;
  } catch (error) {
    console.error(
      "Gmail API Send Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = { sendMailHTTP };
