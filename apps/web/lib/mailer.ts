import nodemailer from 'nodemailer';
import type { SmtpSettings } from '@openregistro/core';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(smtp: SmtpSettings, input: SendEmailInput): Promise<void> {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    // STARTTLS on the standard submission ports (587/25): require the
    // upgrade to succeed rather than silently falling back to plaintext if
    // the server doesn't offer it.
    requireTLS: smtp.port !== 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? undefined } : undefined,
  });

  await transport.sendMail({
    from: smtp.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
