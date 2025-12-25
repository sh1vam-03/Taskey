import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as scheduleController from "../controllers/schedule.controller.js";

const router = express.Router();

router.post("/", authMiddleware, scheduleController.createSchedule);
router.get("/", authMiddleware, scheduleController.getSchedules);
router.put("/:id", authMiddleware, scheduleController.updateSchedule);
router.delete("/:id", authMiddleware, scheduleController.deleteSchedule);

export default router;

