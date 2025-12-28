import express, { Router } from "express";
const router = express.Router();

import healthRoutes from "./health.routes.js";
import publicPagesRoutes from "./publicPages.routes.js";
import authRoutes from "./auth.routes.js";
import taskRoutes from "./task.routes.js";
import taskCompletionRoutes from "./taskCompletion.routes.js";
import categoryRoutes from "./category.routes.js";
import calendarRoutes from "./calendar.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import scheduleCompletionRoutes from "./scheduleCompletion.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

router.use("/api", healthRoutes);
router.use("/api/public-pages", publicPagesRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/tasks", taskCompletionRoutes);
router.use("/api/categories", categoryRoutes);
router.use("/api/calendar", calendarRoutes);
router.use("/api/schedules", scheduleRoutes);
router.use("/api/schedules", scheduleCompletionRoutes);
router.use("/api/dashboard", dashboardRoutes);

export default router;