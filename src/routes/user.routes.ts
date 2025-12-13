import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { upload } from '@/config/multer';
import { updateProfileSchema, getUserPostsQuerySchema } from '@/schemas/user.schema';

const router = Router();

// Protected routes
router.get('/me', authenticate, UserController.getProfile);

router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  UserController.updateProfile
);

router.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  UserController.uploadAvatar
);

router.delete('/me/avatar', authenticate, UserController.deleteAvatar);

// Public routes
router.get('/:username', UserController.getUserByUsername);

router.get(
  '/:username/posts',
  validateQuery(getUserPostsQuerySchema),
  UserController.getUserPosts
);

export default router;

