import ejs from "ejs";
import fs from "fs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { envVars } from "../config/env";
import AppError from "../shared/errors/AppError";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getTemplatesDir = () => {
  const candidates = [
    path.resolve(__dirname, "..", "templates"),
    path.resolve(__dirname, "app", "templates"),
    path.resolve(process.cwd(), "src", "app", "templates"),
    path.resolve(process.cwd(), "dist", "app", "templates"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
};

const TEMPLATES_DIR = getTemplatesDir();

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: EmailAttachment[];
  from?: string;
  text?: string;
}

const smtpPort = Number(envVars.EMAIL_SENDER.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("[EMAIL] SMTP verify failed:", error);
  } else {
    console.log("[EMAIL] SMTP server is ready:", success);
  }
});

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
  from,
  text,
}: SendEmailOptions): Promise<void> => {
  try {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);

    const html = await ejs.renderFile(templatePath, templateData, {
      async: true,
    });

    const info = await transporter.sendMail({
      from: from ?? envVars.EMAIL_SENDER.SMTP_FROM,
      to,
      subject,
      html,
      text,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
  } catch (error: any) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }
};
