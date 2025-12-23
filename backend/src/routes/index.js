import express from "express";
const router = express.Router();

import healthRoutes from "./health.routes.js";
import publicPagesRoutes from "./publicPages.routes.js";
import authRoutes from "./auth.routes.js";
import taskRoutes from "./task.routes.js";

router.use("/api", healthRoutes);
router.use("/api/public-pages", publicPagesRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/tasks", taskRoutes);

export default router;