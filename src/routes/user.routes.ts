import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate, validateQuery } from "@/middleware/validate.middleware";
import { upload } from "@/config/multer";
import {
  updateProfileSchema,
  getUserPostsQuerySchema,
  updateNotificationPreferencesSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/schemas/user.schema";

const router = Router();

// Protected routes
router.get("/me", authenticate, UserController.getProfile);

router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  UserController.updateProfile
);

router.post(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  UserController.uploadAvatar
);

router.delete("/me/avatar", authenticate, UserController.deleteAvatar);

router.post(
  "/me/cover",
  authenticate,
  upload.single("cover"),
  UserController.uploadCoverImage
);

router.delete("/me/cover", authenticate, UserController.deleteCoverImage);

// Notification preferences
router.get(
  "/me/preferences/notifications",
  authenticate,
  UserController.getNotificationPreferences
);

router.patch(
  "/me/preferences/notifications",
  authenticate,
  validate(updateNotificationPreferencesSchema),
  UserController.updateNotificationPreferences
);

// Change password
router.post(
  "/me/change-password",
  authenticate,
  validate(changePasswordSchema),
  UserController.changePassword
);

// Delete account (soft delete)
router.delete(
  "/me",
  authenticate,
  validate(deleteAccountSchema),
  UserController.deleteAccount
);

// Public routes
router.get("/:username", UserController.getUserByUsername);

router.get(
  "/:username/posts",
  validateQuery(getUserPostsQuerySchema),
  UserController.getUserPosts
);

export default router;
