import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as scheduleController from "../controllers/schedule.controller.js";

const router = express.Router();

router.post("/", authMiddleware, scheduleController.createSchedule);


export default router;

