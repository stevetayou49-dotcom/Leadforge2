import nodemailer from 'nodemailer';

let transporter = null;
let warned = false;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.log('ℹ️  Keine SMTP-Zugangsdaten in .env gesetzt — E-Mail-Benachrichtigungen sind deaktiviert.');
      warned = true;
    }
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function notifyNewAnfrage(entry) {
  const t = getTransporter();
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!t || !to) return;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Neue Anfrage: ${entry.name}`,
      text: [
        `Neue Anfrage über die Kiezseite:`,
        ``,
        `Name: ${entry.name}`,
        `E-Mail: ${entry.email}`,
        `Paket: ${entry.paket || '—'}`,
        `Nachricht: ${entry.nachricht || '—'}`,
        ``,
        `In LeadForge unter "Anfragen" ansehen.`,
      ].join('\n'),
    });
  } catch (error) {
    console.error('E-Mail-Benachrichtigung fehlgeschlagen:', error.message);
  }
}
