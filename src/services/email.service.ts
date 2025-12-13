import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter if SMTP is configured
if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: parseInt(env.SMTP_PORT, 10) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export class EmailService {
  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      logger.info(`Verification token for ${email}: ${token}`);
      return;
    }

    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Verifique o seu email - Alldev',
        html: `
          <h1>Bem-vindo ao Alldev!</h1>
          <p>Por favor, clique no link abaixo para verificar o seu email:</p>
          <a href="${verificationUrl}">Verificar Email</a>
          <p>Se não criou uma conta na Alldev, ignore este email.</p>
        `,
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
    }
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      logger.info(`Password reset token for ${email}: ${token}`);
      return;
    }

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Recuperar Password - Alldev',
        html: `
          <h1>Recuperação de Password</h1>
          <p>Recebemos um pedido para recuperar a sua password.</p>
          <p>Clique no link abaixo para criar uma nova password:</p>
          <a href="${resetUrl}">Recuperar Password</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se não fez este pedido, ignore este email.</p>
        `,
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
  }

  static async sendWarningEmail(email: string, reason: string): Promise<void> {
    if (!transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'Aviso - Alldev',
        html: `
          <h1>Aviso da Moderação</h1>
          <p>Recebeu um aviso da equipa de moderação da Alldev.</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p>Por favor, reveja os nossos termos de uso para evitar futuras violações.</p>
        `,
      });
      logger.info(`Warning email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send warning email:', error);
    }
  }
}