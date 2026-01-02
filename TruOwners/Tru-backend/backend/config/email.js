const { sendMailHTTP } = require("../utils/gmailApi");

const transporter = {
  sendMail: async (options) => {
    // Adapter to match nodemailer options to our HTTP helper
    return await sendMailHTTP({
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      from:
        typeof options.from === "object"
          ? `${options.from.name} <${options.from.address}>`
          : options.from,
    });
  },
};

module.exports = transporter;
