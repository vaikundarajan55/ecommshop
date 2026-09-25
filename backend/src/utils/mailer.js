// src/utils/mailer.js
// Sends email through SMTP (Gmail, Brevo, Mailtrap, SES SMTP, ...).
// - SMTP_HOST set          -> real SMTP server
// - not set, development   -> Ethereal test inbox: nothing is delivered, a preview link is printed
// - not set, production    -> email is skipped with a warning
// Sending never throws: a mail problem must not break registration or checkout.
const nodemailer = require('nodemailer');

let transportPromise;

async function createTransport() {
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  if (process.env.NODE_ENV === 'development') {
    const account = await nodemailer.createTestAccount();
    console.log(`[Mail] No SMTP_HOST set - using Ethereal test inbox (${account.user}). Emails are not delivered; open the preview links below.`);
    return nodemailer.createTransport({ host: account.smtp.host, port: account.smtp.port, secure: account.smtp.secure, auth: { user: account.user, pass: account.pass } });
  }
  return null;
}

const getTransport = () => {
  transportPromise ??= createTransport().catch((err) => {
    transportPromise = null; // try again next time (e.g. Ethereal was unreachable)
    throw err;
  });
  return transportPromise;
};

const fromAddress = (shopName) =>
  process.env.MAIL_FROM || `"${shopName || 'Online Store'}" <${process.env.SMTP_USER || 'no-reply@example.com'}>`;

// sendMail({ to, subject, html, text, shopName }) -> true when sent
async function sendMail({ to, subject, html, text, shopName }) {
  try {
    const transport = await getTransport();
    if (!transport) {
      console.warn(`[Mail] SMTP is not configured - skipped "${subject}" to ${to}`);
      return false;
    }
    const info = await transport.sendMail({ from: fromAddress(shopName), to, subject, html, text });
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(`[Mail] Sent "${subject}" to ${to}${preview ? ` - preview: ${preview}` : ''}`);
    return true;
  } catch (err) {
    console.error(`[Mail] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendMail };
