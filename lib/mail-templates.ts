import "server-only";

const BRAND = "SporeERP";
const GREEN = "#1f4d3a";
const IVORY = "#f6f1e7";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(opts: { preheader: string; heading: string; bodyHtml: string; ctaLabel: string; ctaUrl: string; footnote: string }) {
  const url = escapeHtml(opts.ctaUrl);
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${IVORY};font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr><td style="background:${GREEN};padding:22px 28px;color:${IVORY};font-size:22px;font-weight:bold;">🍄 ${BRAND}</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:${GREEN};">${escapeHtml(opts.heading)}</h1>
        ${opts.bodyHtml}
        <p style="margin:28px 0;text-align:center;">
          <a href="${url}" style="background:${GREEN};color:${IVORY};text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:bold;display:inline-block;">${escapeHtml(opts.ctaLabel)}</a>
        </p>
        <p style="font-size:12px;color:#777;margin:0 0 6px;">Button not working? Copy this link into your browser:</p>
        <p style="font-size:12px;word-break:break-all;margin:0 0 20px;"><a href="${url}" style="color:${GREEN};">${url}</a></p>
        <p style="font-size:12px;color:#777;margin:0;">${escapeHtml(opts.footnote)}</p>
      </td></tr>
      <tr><td style="background:#faf8f3;padding:14px 28px;font-size:11px;color:#999;text-align:center;">${BRAND} · Mushroom farm management</td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

export function inviteEmail(opts: { name: string; email: string; roleLabels: string[]; inviteUrl: string; loginUrl: string }) {
  const roles = opts.roleLabels.join(", ") || "Staff";
  const html = layout({
    preheader: `Your ${BRAND} staff account is ready — set your password.`,
    heading: `Welcome to ${BRAND}, ${opts.name}!`,
    bodyHtml: `<p style="line-height:1.6;margin:0 0 12px;">An account has been created for you on the ${BRAND} portal.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#faf8f3;border-radius:10px;padding:12px 16px;margin:0 0 12px;width:100%;font-size:14px;">
        <tr><td style="color:#777;padding:3px 0;width:90px;">Login email</td><td><b>${escapeHtml(opts.email)}</b></td></tr>
        <tr><td style="color:#777;padding:3px 0;">Role</td><td><b>${escapeHtml(roles)}</b></td></tr>
      </table>
      <p style="line-height:1.6;margin:0;">Click below to choose your password. After that, sign in at <a href="${escapeHtml(opts.loginUrl)}" style="color:${GREEN};">${escapeHtml(opts.loginUrl)}</a> with your email and the password you set.</p>`,
    ctaLabel: "Set your password",
    ctaUrl: opts.inviteUrl,
    footnote: "This link is valid for 72 hours and can be used once. If you weren't expecting this, you can ignore this email.",
  });
  const text = `Hi ${opts.name},\n\nAn account has been created for you on ${BRAND}.\nLogin email: ${opts.email}\nRole: ${roles}\n\nSet your password (valid for 72 hours):\n${opts.inviteUrl}\n\nThen sign in at ${opts.loginUrl}`;
  return { subject: `You're invited to ${BRAND}`, html, text };
}

export function resetEmail(opts: { name: string; resetUrl: string }) {
  const html = layout({
    preheader: "Reset your password",
    heading: "Reset your password",
    bodyHtml: `<p style="line-height:1.6;margin:0;">Hi ${escapeHtml(opts.name)}, we received a request to reset your ${BRAND} password.</p>`,
    ctaLabel: "Reset password",
    ctaUrl: opts.resetUrl,
    footnote: "This link is valid for 1 hour. If you didn't request this, you can safely ignore this email.",
  });
  const text = `Hi ${opts.name},\n\nReset your password using this link (valid for 1 hour):\n${opts.resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  return { subject: `Reset your ${BRAND} password`, html, text };
}
