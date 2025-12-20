import { Router } from "express";
import { CookiePolicyController } from "@/controllers/cookie-policy.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireModerator } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { updateCookiePolicySchema } from "@/schemas/cookie-policy.schema";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get current content
router.get("/", CookiePolicyController.getContent);

// ============================================
// ADMIN/MODERATOR ROUTES
// ============================================

// Get content for editing (with metadata)
router.get(
  "/admin",
  authenticate,
  requireModerator,
  CookiePolicyController.getContentForEdit
);

// Update content
router.patch(
  "/admin",
  authenticate,
  requireModerator,
  validate(updateCookiePolicySchema),
  CookiePolicyController.updateContent
);

// Get update history
router.get(
  "/admin/history",
  authenticate,
  requireModerator,
  CookiePolicyController.getHistory
);

// Seed default content
router.post(
  "/admin/seed",
  authenticate,
  requireModerator,
  CookiePolicyController.seedDefault
);

export default router;
