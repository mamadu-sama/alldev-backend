import { Router } from "express";
import { StatsController } from "@/controllers/stats.controller";

const router = Router();

// Public route - Community statistics
router.get("/community", StatsController.getCommunityStats);

export default router;

