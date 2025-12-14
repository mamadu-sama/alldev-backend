import { Request, Response, NextFunction } from 'express';
import { ContactAdminService } from '@/services/contact-admin.service';
import { AuthenticatedRequest } from '@/types';

export class ContactAdminController {
  /**
   * GET /api/admin/contact-messages
   * Get all contact messages
   */
  static async getAllMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const reason = req.query.reason as string;
      const searchTerm = req.query.search as string;

      const { data, meta } = await ContactAdminService.getAllMessages(
        page,
        limit,
        status,
        reason,
        searchTerm
      );

      res.status(200).json({ success: true, data, meta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/contact-messages/:id
   * Get a single contact message
   */
  static async getMessageById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const message = await ContactAdminService.getMessageById(id);

      res.status(200).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/contact-messages/:id/status
   * Update message status
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const message = await ContactAdminService.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Status atualizado com sucesso.',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/contact-messages/:id
   * Delete a contact message
   */
  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ContactAdminService.deleteMessage(id);

      res.status(200).json({
        success: true,
        message: 'Mensagem excluída com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/contact-messages/:id/reply
   * Send reply to contact message
   */
  static async sendReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      const adminEmail = req.user!.email;

      await ContactAdminService.sendReply(id, replyMessage, adminEmail);

      res.status(200).json({
        success: true,
        message: 'Resposta enviada com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/contact-messages/stats
   * Get statistics
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ContactAdminService.getStats();

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

