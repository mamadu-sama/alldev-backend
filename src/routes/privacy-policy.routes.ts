import { Router } from "express";
import { PrivacyPolicyController } from "@/controllers/privacy-policy.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireModerator } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { updatePrivacyPolicySchema } from "@/schemas/privacy-policy.schema";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get current content
router.get("/", PrivacyPolicyController.getContent);

// ============================================
// ADMIN/MODERATOR ROUTES
// ============================================

// Get content for editing (with metadata)
router.get(
  "/admin",
  authenticate,
  requireModerator,
  PrivacyPolicyController.getContentForEdit
);

// Update content
router.patch(
  "/admin",
  authenticate,
  requireModerator,
  validate(updatePrivacyPolicySchema),
  PrivacyPolicyController.updateContent
);

// Get update history
router.get(
  "/admin/history",
  authenticate,
  requireModerator,
  PrivacyPolicyController.getHistory
);

// Seed default content
router.post(
  "/admin/seed",
  authenticate,
  requireModerator,
  PrivacyPolicyController.seedDefault
);

export default router;
