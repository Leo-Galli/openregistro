import nodemailer from 'nodemailer';
import type { SmtpSettings } from '@openregistro/core';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(smtp: SmtpSettings, input: SendEmailInput): Promise<void> {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? undefined } : undefined,
  });

  await transport.sendMail({
    from: smtp.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
}
