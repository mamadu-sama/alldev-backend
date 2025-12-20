import { Router } from "express";
import { AdminService } from "@/services/admin.service";

const router = Router();

// Public endpoint to get current maintenance mode (no auth)
router.get("/", async (_req, res, next) => {
  try {
    const maintenance = await AdminService.getMaintenanceMode();
    res.json({ success: true, data: maintenance });
  } catch (error) {
    next(error);
  }
});

export default router;
