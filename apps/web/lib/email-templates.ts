const INK = '#151b32';
const CREAM = '#fffbeb';
const YELLOW = '#ffcd29';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BrandedEmailOptions {
  /** Shown by some mail clients in the inbox list preview, hidden in the body. */
  preheader?: string;
  heading: string;
  /** Rendered as separate paragraphs, in order. Plain text - HTML-escaped automatically. */
  bodyLines: string[];
  cta?: { label: string; url: string };
  footnote?: string;
}

/**
 * Renders both an HTML and a plain-text version of a Pop Ledger-styled
 * transactional email. Table-based layout and inline styles throughout -
 * email clients (Outlook especially) don't reliably support modern CSS, so
 * this intentionally skips the app's hard-shadow/radius language in favor of
 * a simpler bordered-card look that degrades safely everywhere.
 *
 * Every dynamic string (heading, body lines, footnote, CTA label) is
 * HTML-escaped before interpolation - some of this content originates from
 * the public, unauthenticated hosting-request form, so it must never be
 * trusted as safe markup.
 */
export function renderBrandedEmail(options: BrandedEmailOptions): { html: string; text: string } {
  const heading = escapeHtml(options.heading);
  const paragraphs = options.bodyLines.map((line) => escapeHtml(line));
  const footnote = options.footnote ? escapeHtml(options.footnote) : null;

  const bodyHtml = paragraphs
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">${line}</p>`,
    )
    .join('\n');

  const ctaHtml = options.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
  <tr>
    <td style="border:2px solid ${INK};background:${YELLOW};border-radius:8px;">
      <a href="${escapeHtml(options.cta.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:700;color:${INK};text-decoration:none;">${escapeHtml(options.cta.label)}</a>
    </td>
  </tr>
</table>`
    : '';

  const footnoteHtml = footnote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">${footnote}</p>`
    : '';

  const preheaderHtml = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CREAM};font-family:Georgia,'Times New Roman',serif;">
    ${preheaderHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${INK};border-radius:12px 12px 0 0;padding:20px 24px;">
                <span style="font-size:18px;font-weight:700;color:${CREAM};letter-spacing:0.02em;">OpenRegistro</span>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:2px solid ${INK};border-top:none;border-radius:0 0 12px 12px;padding:28px 24px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${INK};">${heading}</h1>
                ${bodyHtml}
                ${ctaHtml}
                ${footnoteHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    options.heading,
    '',
    ...options.bodyLines,
    ...(options.cta ? ['', `${options.cta.label}: ${options.cta.url}`] : []),
    ...(options.footnote ? ['', options.footnote] : []),
  ].join('\n');

  return { html, text };
}
