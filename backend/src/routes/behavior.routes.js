import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as behaviorController from "../controllers/behavior.controller.js";

const router = Router();

router.get("/summary", authMiddleware, behaviorController.getBehaviorSummary);
router.get("/:date", authMiddleware, behaviorController.getBehaviorByDate);
router.post("/", authMiddleware, behaviorController.upsertBehavior);

export default router;
