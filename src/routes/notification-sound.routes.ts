import { Router } from "express";
import { NotificationSoundController } from "@/controllers/notification-sound.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/role.middleware";
import { uploadSound } from "@/config/multer-sound";
import { Role } from "@prisma/client";

const router = Router();

// Public routes (authenticated users)
router.get(
  "/notification-sounds",
  authenticate,
  NotificationSoundController.getAllSounds
);

router.get(
  "/notification-sounds/:soundId",
  authenticate,
  NotificationSoundController.getSoundById
);

// User preference routes
router.get(
  "/users/me/notification-sound-preferences",
  authenticate,
  NotificationSoundController.getUserPreferences
);

router.put(
  "/users/me/notification-sound-preferences/:notificationType",
  authenticate,
  NotificationSoundController.setUserPreference
);

router.post(
  "/users/me/notification-sound-preferences/batch",
  authenticate,
  NotificationSoundController.batchUpdatePreferences
);

router.delete(
  "/users/me/notification-sound-preferences",
  authenticate,
  NotificationSoundController.resetPreferences
);

// Admin routes
router.post(
  "/admin/notification-sounds",
  authenticate,
  requireRole(Role.ADMIN),
  uploadSound.single("audio"),
  NotificationSoundController.uploadSound
);

router.patch(
  "/admin/notification-sounds/:soundId",
  authenticate,
  requireRole(Role.ADMIN),
  NotificationSoundController.updateSound
);

router.delete(
  "/admin/notification-sounds/:soundId",
  authenticate,
  requireRole(Role.ADMIN),
  NotificationSoundController.deleteSound
);

router.get(
  "/admin/notification-sounds/:soundId/statistics",
  authenticate,
  requireRole(Role.ADMIN),
  NotificationSoundController.getSoundStatistics
);

export default router;
