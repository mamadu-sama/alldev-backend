import { Router } from "express";
import { TermsOfUseController } from "@/controllers/terms-of-use.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { requireModerator } from "@/middleware/role.middleware";
import { validate } from "@/middleware/validate.middleware";
import { updateTermsOfUseSchema } from "@/schemas/terms-of-use.schema";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get current content
router.get("/", TermsOfUseController.getContent);

// ============================================
// ADMIN/MODERATOR ROUTES
// ============================================

// Get content for editing (with metadata)
router.get(
  "/admin",
  authenticate,
  requireModerator,
  TermsOfUseController.getContentForEdit
);

// Update content
router.patch(
  "/admin",
  authenticate,
  requireModerator,
  validate(updateTermsOfUseSchema),
  TermsOfUseController.updateContent
);

// Get update history
router.get(
  "/admin/history",
  authenticate,
  requireModerator,
  TermsOfUseController.getHistory
);

// Seed default content
router.post(
  "/admin/seed",
  authenticate,
  requireModerator,
  TermsOfUseController.seedDefault
);

export default router;
