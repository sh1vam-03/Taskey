import express from "express";
import * as calendarController from "../controllers/calendar.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/day", authMiddleware, calendarController.getDayCalendar);
router.get("/week", authMiddleware, calendarController.getWeekCalendar);
router.get("/month", authMiddleware, calendarController.getMonthCalendar);

export default router;
