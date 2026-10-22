'use server';

import { z } from 'zod';
import { getStorage } from '@/lib/storage';
import { sendEmail } from '@/lib/mailer';

const smtpFormSchema = z.object({
  host: z.string().min(1, 'Required'),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().optional(),
  password: z.string().optional(),
  from: z.string().min(1, 'Required'),
});

export type SmtpFormInput = z.infer<typeof smtpFormSchema>;

export interface SmtpFormState {
  ok: boolean;
  testSent?: boolean;
  fieldErrors?: Partial<Record<keyof SmtpFormInput, string>>;
  formError?: string;
}

export async function submitSmtpForm(
  _prevState: SmtpFormState,
  formData: FormData,
): Promise<SmtpFormState> {
  const parsed = smtpFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: SmtpFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SmtpFormInput;
      fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const smtp = {
    host: parsed.data.host,
    port: parsed.data.port,
    user: parsed.data.user || null,
    password: parsed.data.password || null,
    from: parsed.data.from,
  };

  try {
    const storage = await getStorage();
    await storage.settings.update({ smtp });

    const intent = formData.get('intent');
    if (intent === 'test') {
      const to = formData.get('testRecipient');
      if (typeof to !== 'string' || !to) {
        return { ok: false, formError: 'Enter an address to send the test email to.' };
      }
      await sendEmail(smtp, {
        to,
        subject: 'OpenRegistro test email',
        text: 'If you received this, your SMTP settings are working.',
      });
      return { ok: false, testSent: true };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not reach the SMTP server.',
    };
  }
}

export async function skipSmtpSetup(): Promise<SmtpFormState> {
  return { ok: true };
}
