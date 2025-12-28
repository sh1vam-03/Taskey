import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

//CORE DASHBOARD
router.get("/overview", authMiddleware, dashboardController.getDashboardOverview);
router.get("/today", authMiddleware, dashboardController.getTodayDashboard);
router.get("/weekly", authMiddleware, dashboardController.getWeeklyDashboard);
router.get("/monthly", authMiddleware, dashboardController.getMonthlyDashboard);

//STREAKS
router.get("/streaks", authMiddleware, dashboardController.getStreakOverview);
router.get("/streak-calendar", authMiddleware, dashboardController.getStreakCalendar);

//PERFORMANCE
router.get("/performance/daily", authMiddleware, dashboardController.getDailyPerformance);
router.get("/performance/weekly", authMiddleware, dashboardController.getWeeklyPerformance);
router.get("/performance/monthly", authMiddleware, dashboardController.getMonthlyPerformance);

export default router;
