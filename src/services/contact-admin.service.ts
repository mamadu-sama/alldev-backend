import { prisma } from "@/config/database";
import { NotFoundError } from "@/types";
import { getPaginationParams, createPaginationMeta } from "@/utils/pagination";
import { logger } from "@/utils/logger";
import nodemailer from "nodemailer";
import { env } from "@/config/env";

export class ContactAdminService {
  /**
   * Get all contact messages with pagination and filters
   */
  static async getAllMessages(
    page: number = 1,
    limit: number = 20,
    status?: string,
    reason?: string,
    searchTerm?: string
  ) {
    const { skip, take } = getPaginationParams({ page, limit });

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (reason && reason !== "all") {
      where.reason = reason;
    }

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { message: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    const meta = createPaginationMeta({ total, page, limit });

    return { data: messages, meta };
  }

  /**
   * Get a single contact message by ID
   */
  static async getMessageById(id: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError("Mensagem não encontrada.");
    }

    return message;
  }

  /**
   * Update message status
   */
  static async updateStatus(id: string, status: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError("Mensagem não encontrada.");
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    logger.info(`Contact message status updated`, { messageId: id, status });

    return updated;
  }

  /**
   * Delete a contact message
   */
  static async deleteMessage(id: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError("Mensagem não encontrada.");
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    logger.info(`Contact message deleted`, { messageId: id });
  }

  /**
   * Send reply email to contact message
   */
  static async sendReply(id: string, replyMessage: string, adminEmail: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError("Mensagem não encontrada.");
    }

    // Check if SMTP is configured
    const smtpConfigured = env.SMTP_USER && env.SMTP_PASS;

    if (smtpConfigured) {
      try {
        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST || "smtp.gmail.com",
          port: env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        // Send email
        await transporter.sendMail({
          from: `"Alldev Support" <${env.SMTP_USER}>`,
          to: message.email,
          subject: `Re: ${message.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Resposta à sua mensagem</h2>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                <p style="margin: 0; color: #666;"><strong>Sua mensagem original:</strong></p>
                <p style="margin: 10px 0 0 0; color: #333;">${message.message}</p>
              </div>
              
              <div style="margin: 20px 0;">
                <p style="color: #333;"><strong>Nossa resposta:</strong></p>
                <p style="color: #555; white-space: pre-wrap;">${replyMessage}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px;">
                Esta é uma resposta à sua mensagem enviada através do formulário de contato da Alldev.<br>
                Se tiver mais dúvidas, por favor responda a este email ou visite nosso site.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                <strong>Alldev</strong> - Comunidade de Programadores<br>
                <a href="${env.FRONTEND_URL}" style="color: #4CAF50;">www.alldev.com</a>
              </p>
            </div>
          `,
        });

        logger.info(`Reply email sent to contact message`, {
          messageId: id,
          recipientEmail: message.email,
          adminEmail,
        });
      } catch (error) {
        logger.error("Failed to send reply email", {
          messageId: id,
          error,
        });
        // Continue even if email fails - we still mark as replied
      }
    } else {
      logger.warn("SMTP not configured - reply saved but email not sent", {
        messageId: id,
      });
    }

    // Update message status to REPLIED
    await prisma.contactMessage.update({
      where: { id },
      data: { status: "REPLIED" },
    });

    logger.info(`Reply registered for contact message`, {
      messageId: id,
      recipientEmail: message.email,
      adminEmail,
      emailSent: smtpConfigured,
    });
  }

  /**
   * Get statistics
   */
  static async getStats() {
    const [total, pending, read, replied] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: "PENDING" } }),
      prisma.contactMessage.count({ where: { status: "READ" } }),
      prisma.contactMessage.count({ where: { status: "REPLIED" } }),
    ]);

    return { total, pending, read, replied };
  }
}
