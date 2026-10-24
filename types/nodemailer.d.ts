// Minimal typing for the parts of nodemailer we use. @types/nodemailer pulls in the AWS SDK
// typings, which exhaust tsc's memory on this project.
declare module "nodemailer" {
  export interface Transporter {
    sendMail(options: {
      from?: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    }): Promise<unknown>;
  }
  export function createTransport(options: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  }): Transporter;
  const nodemailer: { createTransport: typeof createTransport };
  export default nodemailer;
}
