import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

type MailMessage = { to: string; subject: string; text: string; html?: string };

let transporter: Transporter | null | undefined;

// Returns null when MAIL_USER / MAIL_PASSWORD are not set, in which case messages are only logged.
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const { MAIL_USER, MAIL_PASSWORD } = process.env;
  if (!MAIL_USER || !MAIL_PASSWORD) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.MAIL_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? "smtp.gmail.com",
    port,
    secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === "true" : port === 465,
    // Gmail needs an App Password here, not the account password.
    auth: { user: MAIL_USER, pass: MAIL_PASSWORD },
  });
  return transporter;
}

/**
 * Sends via SMTP when configured, otherwise logs the message (including links) to the server
 * console. Never throws: callers have usually committed DB changes already, and the invite/reset
 * link is still available on screen or in the log.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const smtp = getTransporter();
  if (!smtp) {
    console.info(`[mail] (SMTP not configured) To: ${message.to}\n[mail] Subject: ${message.subject}\n${message.text}`);
    return false;
  }
  try {
    await smtp.sendMail({
      from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    console.info(`[mail] Sent "${message.subject}" to ${message.to}`);
    return true;
  } catch (error) {
    console.error(`[mail] Failed to send "${message.subject}" to ${message.to}:`, error);
    console.info(`[mail] Fallback content:\n${message.text}`);
    return false;
  }
}
