import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as behaviorController from "../controllers/behavior.controller.js";

const router = Router();

router.post("/", authMiddleware, behaviorController.upsertBehavior);
router.get("/:date", authMiddleware, behaviorController.getBehaviorByDate);
router.get("/summary", authMiddleware, behaviorController.getBehaviorSummary);
router.get("/explain/:date", authMiddleware, behaviorController.explainScore);

export default router;
