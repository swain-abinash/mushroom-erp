import "server-only";

type MailMessage = { to: string; subject: string; text: string };

// No mail transport is configured yet; messages are written to the server log so that reset and
// invite links can be used during development. Swap this for a real provider before go-live.
export async function sendMail(message: MailMessage): Promise<void> {
  console.info(`[mail] To: ${message.to}\n[mail] Subject: ${message.subject}\n${message.text}`);
}
