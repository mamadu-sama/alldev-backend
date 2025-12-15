import { Request, Response, NextFunction } from 'express';
import { UploadService } from '@/services/upload.service';
import { ValidationError } from '@/types';

export class UploadController {
  static async uploadContentImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('Nenhum arquivo foi enviado');
      }

      const userId = req.user!.id;
      const { buffer, originalname, mimetype } = req.file;

      const imageUrl = await UploadService.uploadContentImage(
        buffer,
        userId,
        originalname,
        mimetype
      );

      res.status(201).json({
        success: true,
        data: {
          url: imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

