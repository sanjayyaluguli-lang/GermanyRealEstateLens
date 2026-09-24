import "server-only";
import nodemailer from "nodemailer";
import { log } from "./logger";

// Transactional e-mail via SMTP. Use an EU-hosted provider (e.g. Brevo,
// Mailjet, Scaleway TEM) to keep personal data in the EU.
//
// Without SMTP_URL, development prints the message to the server console so
// the flows can be tested locally. Production refuses to run without it.

export function appUrl(path = "") {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export async function sendMail(to: string, subject: string, text: string) {
  const smtp = process.env.SMTP_URL;
  if (!smtp) {
    if (process.env.NODE_ENV === "production") {
      log.error("mail.not_configured");
      throw new Error("SMTP_URL is not configured");
    }
    console.info(`\n--- DEV MAIL (not sent) ---\nSubject: ${subject}\n\n${text}\n---------------------------\n`);
    return;
  }
  const transport = nodemailer.createTransport(smtp);
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "GermanyRealEstateLens <no-reply@localhost>",
    to,
    subject,
    text,
  });
  log.info("mail.sent", { subject });
}
