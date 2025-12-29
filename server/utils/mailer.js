import nodemailer from "nodemailer";

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const send_support_mail = async (emails, subject, htmlContent) => {
  try {
    const mailDetails = {
      from: process.env.GMAIL_USER,
      to: emails,
      subject,
      html: htmlContent,
    };

    await mailTransporter.sendMail(mailDetails);
    return true;
  } catch (err) {
    console.log("Mail error:", err);
    return false;
  }
};

export { send_support_mail };
