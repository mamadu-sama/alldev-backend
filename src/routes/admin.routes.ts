import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { banUserSchema, updateMaintenanceModeSchema } from '@/schemas/moderation.schema';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// All routes require admin role
const adminAuth = [authenticate, requireRole(Role.ADMIN)];

// User management
router.get('/admin/users', ...adminAuth, AdminController.getAllUsers);
router.patch(
  '/admin/users/:userId/role',
  ...adminAuth,
  validate(
    z.object({
      roles: z.array(z.enum(['USER', 'MODERATOR', 'ADMIN'])),
    })
  ),
  AdminController.updateUserRole
);
router.post('/admin/users/:userId/ban', ...adminAuth, validate(banUserSchema), AdminController.banUser);
router.post('/admin/users/:userId/unban', ...adminAuth, AdminController.unbanUser);
router.delete('/admin/users/:userId', ...adminAuth, AdminController.deleteUser);

// Maintenance mode
router.get('/admin/maintenance', ...adminAuth, AdminController.getMaintenanceMode);
router.post(
  '/admin/maintenance',
  ...adminAuth,
  validate(updateMaintenanceModeSchema),
  AdminController.updateMaintenanceMode
);

// Statistics and Dashboard
router.get('/admin/statistics', ...adminAuth, AdminController.getStatistics);
router.get('/admin/recent-posts', ...adminAuth, AdminController.getRecentPosts);
router.get('/admin/recent-users', ...adminAuth, AdminController.getRecentUsers);

export default router;


