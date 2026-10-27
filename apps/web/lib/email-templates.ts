const INK = '#151b32';
const CREAM = '#fffbeb';
const YELLOW = '#ffcd29';
const MUTED = '#6b7280';
const BORDER = '#e7e2d3';
const FACT_BG = '#fbf6e8';

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
  /** Small uppercase label above the heading, e.g. "HOSTING REQUEST". */
  eyebrow?: string;
  heading: string;
  /** Rendered as separate paragraphs, in order. Plain text - HTML-escaped automatically. */
  bodyLines: string[];
  /** Optional key/value facts rendered as a bordered info card under the body text. */
  facts?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  footnote?: string;
}

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/**
 * Renders both an HTML and a plain-text version of a Pop Ledger-styled
 * transactional email. Table-based layout and inline styles throughout -
 * email clients (Outlook especially) don't reliably support modern CSS, so
 * this intentionally skips the app's hard-shadow/radius language (an offset
 * drop-shadow built from nested tables renders inconsistently across Outlook/
 * Gmail) in favor of a simpler bordered-card look that degrades safely
 * everywhere, while still getting a real visual hierarchy: an eyebrow label,
 * a monogram mark next to the wordmark, and an optional bordered "facts" card
 * for key details instead of burying them in prose.
 *
 * Every dynamic string (heading, body lines, facts, footnote, CTA label) is
 * HTML-escaped before interpolation - some of this content originates from
 * the public, unauthenticated hosting-request form, so it must never be
 * trusted as safe markup.
 */
export function renderBrandedEmail(options: BrandedEmailOptions): { html: string; text: string } {
  const heading = escapeHtml(options.heading);
  const eyebrow = options.eyebrow ? escapeHtml(options.eyebrow) : null;
  const paragraphs = options.bodyLines.map((line) => escapeHtml(line));
  const footnote = options.footnote ? escapeHtml(options.footnote) : null;

  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b8860b;font-family:${SANS};">${eyebrow}</p>`
    : '';

  const bodyHtml = paragraphs
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${INK};font-family:${SANS};">${line}</p>`,
    )
    .join('\n');

  const factsHtml = options.facts?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 20px;background:${FACT_BG};border:1px solid ${BORDER};border-radius:10px;">
  <tr>
    <td style="padding:14px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${options.facts
          .map(
            (fact, index) => `<tr>
          <td style="padding:${index === 0 ? '0' : '8px'} 0 0;font-size:12px;font-weight:700;letter-spacing:0.03em;color:${MUTED};font-family:${SANS};white-space:nowrap;vertical-align:top;width:1%;">${escapeHtml(fact.label)}</td>
          <td style="padding:${index === 0 ? '0' : '8px'} 0 0 14px;font-size:14px;color:${INK};font-family:${SANS};">${escapeHtml(fact.value)}</td>
        </tr>`,
          )
          .join('\n')}
      </table>
    </td>
  </tr>
</table>`
    : '';

  const ctaHtml = options.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;">
  <tr>
    <td style="border:2px solid ${INK};background:${YELLOW};border-radius:10px;">
      <a href="${escapeHtml(options.cta.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:${INK};text-decoration:none;font-family:${SANS};">${escapeHtml(options.cta.label)}</a>
    </td>
  </tr>
</table>`
    : '';

  const footnoteHtml = footnote
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:22px;">
  <tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr>
    <td style="padding-top:16px;font-size:12px;line-height:1.6;color:${MUTED};font-family:${SANS};">${footnote}</td>
  </tr>
</table>`
    : '';

  const preheaderHtml = options.preheader
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(options.preheader)}&#8203;&#847; &#8203;&#847; &#8203;&#847;</div>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:${CREAM};">
    ${preheaderHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="background:${INK};border-radius:14px 14px 0 0;padding:22px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${YELLOW};border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:15px;font-weight:800;color:${INK};font-family:${SANS};">OR</td>
                    <td style="padding-left:10px;font-size:17px;font-weight:700;color:${CREAM};letter-spacing:0.01em;font-family:${SANS};vertical-align:middle;">OpenRegistro</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height:3px;line-height:3px;font-size:0;background:${YELLOW};">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:2px solid ${INK};border-top:none;border-radius:0 0 14px 14px;padding:30px 26px;">
                ${eyebrowHtml}
                <h1 style="margin:0 0 16px;font-size:23px;line-height:1.3;color:${INK};font-family:${SERIF};">${heading}</h1>
                ${bodyHtml}
                ${factsHtml}
                ${ctaHtml}
                ${footnoteHtml}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:11px;color:#a89d7a;font-family:${SANS};">
            OpenRegistro - open source, self-hosted school register
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    ...(options.eyebrow ? [options.eyebrow.toUpperCase(), ''] : []),
    options.heading,
    '',
    ...options.bodyLines,
    ...(options.facts?.length
      ? ['', ...options.facts.map((fact) => `${fact.label}: ${fact.value}`)]
      : []),
    ...(options.cta ? ['', `${options.cta.label}: ${options.cta.url}`] : []),
    ...(options.footnote ? ['', options.footnote] : []),
  ].join('\n');

  return { html, text };
}
