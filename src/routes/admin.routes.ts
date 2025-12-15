import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { SettingsController } from '@/controllers/settings.controller';
import { TagController } from '@/controllers/tag.controller';
import { ReportController } from '@/controllers/report.controller';
import { ContactAdminController } from '@/controllers/contact-admin.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/role.middleware';
import { requireModerator } from '@/middleware/role.middleware';
import { validate } from '@/middleware/validate.middleware';
import { banUserSchema, updateMaintenanceModeSchema } from '@/schemas/moderation.schema';
import { updateSettingsSchema } from '@/schemas/settings.schema';
import { createTagSchema, updateTagSchema } from '@/schemas/tag.schema';
import { updateReportStatusSchema } from '@/schemas/report.schema';
import { updateContactStatusSchema, sendReplySchema } from '@/schemas/contact-admin.schema';
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

// Posts Management
router.get('/admin/posts', ...adminAuth, AdminController.getAllPosts);
router.delete('/admin/posts/:postId', ...adminAuth, AdminController.deletePost);
router.post(
  '/admin/posts/:postId/hide',
  ...adminAuth,
  validate(z.object({ reason: z.string().min(5, 'Motivo deve ter no mínimo 5 caracteres') })),
  AdminController.hidePost
);
router.post('/admin/posts/:postId/unhide', ...adminAuth, AdminController.unhidePost);

// Comments Management
router.get('/admin/comments', ...adminAuth, AdminController.getAllComments);
router.delete('/admin/comments/:commentId', ...adminAuth, AdminController.deleteComment);

// Settings Management
router.get('/admin/settings', ...adminAuth, SettingsController.getSettings);
router.patch(
  '/admin/settings',
  ...adminAuth,
  validate(updateSettingsSchema),
  SettingsController.updateSettings
);

// Tags Management
router.get('/admin/tags', ...adminAuth, TagController.getAllTags);
router.post('/admin/tags', ...adminAuth, validate(createTagSchema), TagController.createTag);
router.patch('/admin/tags/:id', ...adminAuth, validate(updateTagSchema), TagController.updateTag);
router.delete('/admin/tags/:id', ...adminAuth, TagController.deleteTag);

// Reports Management (Admin + Moderator)
const moderatorAuth = [authenticate, requireModerator];
router.get('/admin/reports', ...moderatorAuth, ReportController.getReports);
router.patch(
  '/admin/reports/:reportId',
  ...moderatorAuth,
  validate(updateReportStatusSchema),
  ReportController.updateReportStatus
);

// Contact Messages Management (Admin only)
router.get('/admin/contact-messages/stats', ...adminAuth, ContactAdminController.getStats);
router.get('/admin/contact-messages', ...adminAuth, ContactAdminController.getAllMessages);
router.get('/admin/contact-messages/:id', ...adminAuth, ContactAdminController.getMessageById);
router.patch(
  '/admin/contact-messages/:id/status',
  ...adminAuth,
  validate(updateContactStatusSchema),
  ContactAdminController.updateStatus
);
router.post(
  '/admin/contact-messages/:id/reply',
  ...adminAuth,
  validate(sendReplySchema),
  ContactAdminController.sendReply
);
router.delete('/admin/contact-messages/:id', ...adminAuth, ContactAdminController.deleteMessage);

export default router;



