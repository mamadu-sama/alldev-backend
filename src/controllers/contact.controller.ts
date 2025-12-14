import { Request, Response, NextFunction } from 'express';
import { ContactService } from '@/services/contact.service';
import { ApiResponse } from '@/types';

export class ContactController {
  static async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      
      const result = await ContactService.createContact(req.body, ip as string);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

