import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as controller from "../controllers/scheduleCompletion.controller.js";

const router = Router();

router.post("/:id/complete", authMiddleware, controller.completeSchedule);
router.delete("/:id/complete", authMiddleware, controller.undoCompleteSchedule);
router.post("/complete-bulk", authMiddleware, controller.completeBulk);
router.get("/history", authMiddleware, controller.getCompletionHistory);

export default router;
