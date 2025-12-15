import { Router } from 'express';
import { UploadController } from '@/controllers/upload.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { upload } from '@/config/multer';

const router = Router();

// Upload content image (authenticated users only)
router.post(
  '/content-image',
  authenticate,
  upload.single('image'),
  UploadController.uploadContentImage
);

export default router;

