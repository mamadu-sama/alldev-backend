import { Router } from "express";
import { TagController } from "@/controllers/tag.controller";
import { authenticate, optionalAuth } from "@/middleware/auth.middleware";
import { requireAdmin } from "@/middleware/role.middleware";
import { validate, validateQuery } from "@/middleware/validate.middleware";
import {
  createTagSchema,
  updateTagSchema,
  getTagsQuerySchema,
} from "@/schemas/tag.schema";

const router = Router();

// Public routes
router.get("/", validateQuery(getTagsQuerySchema), TagController.getAllTags);

router.get("/:slug", TagController.getTagBySlug);

router.get("/:slug/posts", optionalAuth, TagController.getPostsByTag);

// User routes - Tag Following
router.post("/:id/follow", authenticate, TagController.followTag);

router.delete("/:id/follow", authenticate, TagController.unfollowTag);

router.get("/followed/my-tags", authenticate, TagController.getFollowedTags);

router.patch(
  "/:id/follow/notifications",
  authenticate,
  TagController.updateNotificationPreference
);

// Admin routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createTagSchema),
  TagController.createTag
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(updateTagSchema),
  TagController.updateTag
);

router.delete("/:id", authenticate, requireAdmin, TagController.deleteTag);

export default router;
