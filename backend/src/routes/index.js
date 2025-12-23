import express, { Router } from "express";
const router = express.Router();

import healthRoutes from "./health.routes.js";
import publicPagesRoutes from "./publicPages.routes.js";
import authRoutes from "./auth.routes.js";
import taskRoutes from "./task.routes.js";
import categoryRoutes from "./category.routes.js";

router.use("/api", healthRoutes);
router.use("/api/public-pages", publicPagesRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/categories", categoryRoutes);

export default router;