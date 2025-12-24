import express from "express";
import * as calendarController from "../controllers/calendar.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/day", authMiddleware, calendarController.getDayCalender);
router.get("/week", authMiddleware, calendarController.getWeekCalender);
router.get("/month", authMiddleware, calendarController.getMonthCalender);

export default router;
