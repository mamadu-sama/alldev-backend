import { prisma } from '@/config/database';
import { ContactData } from '@/schemas/contact.schema';
import { logger } from '@/utils/logger';

export class ContactService {
  static async createContact(data: ContactData, ip?: string) {
    try {
      // Sanitize inputs (remove potential XSS)
      const sanitizedData = {
        name: this.sanitizeString(data.name),
        email: data.email.toLowerCase().trim(),
        reason: data.reason,
        subject: this.sanitizeString(data.subject),
        message: this.sanitizeString(data.message),
        ip: ip || 'unknown',
      };

      // Check for recent submissions from same email (spam prevention)
      const recentSubmission = await prisma.contactMessage.findFirst({
        where: {
          email: sanitizedData.email,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (recentSubmission) {
        logger.warn(`Duplicate contact attempt from ${sanitizedData.email} within 1 hour`);
        throw new Error('Você já enviou uma mensagem recentemente. Aguarde antes de enviar outra.');
      }

      // Check for spam patterns
      if (this.containsSpamPatterns(sanitizedData.message)) {
        logger.warn(`Spam detected from ${sanitizedData.email}`);
        throw new Error('Sua mensagem contém conteúdo suspeito.');
      }

      // Create contact message
      const contact = await prisma.contactMessage.create({
        data: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          reason: sanitizedData.reason,
          subject: sanitizedData.subject,
          message: sanitizedData.message,
          ip: sanitizedData.ip,
          status: 'PENDING',
        },
      });

      logger.info(`Contact message created: ${contact.id} from ${contact.email}`);

      // TODO: Send email notification to admin
      // await this.sendNotificationEmail(contact);

      return {
        id: contact.id,
        createdAt: contact.createdAt,
      };
    } catch (error) {
      logger.error('Failed to create contact message:', error);
      throw error;
    }
  }

  private static sanitizeString(str: string): string {
    // Remove HTML tags and dangerous characters
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  private static containsSpamPatterns(message: string): boolean {
    const spamKeywords = [
      'viagra',
      'casino',
      'lottery',
      'prize',
      'click here',
      'buy now',
      'limited time',
      'act now',
      'winner',
      'congratulations',
    ];

    const lowercaseMessage = message.toLowerCase();
    
    // Check for spam keywords
    const hasSpamKeywords = spamKeywords.some(keyword => 
      lowercaseMessage.includes(keyword)
    );

    // Check for excessive links (more than 3)
    const linkCount = (message.match(/https?:\/\//g) || []).length;
    const hasExcessiveLinks = linkCount > 3;

    // Check for excessive capital letters (more than 50%)
    const capitalCount = (message.match(/[A-Z]/g) || []).length;
    const capitalRatio = capitalCount / message.length;
    const hasExcessiveCaps = capitalRatio > 0.5 && message.length > 20;

    return hasSpamKeywords || hasExcessiveLinks || hasExcessiveCaps;
  }
}

