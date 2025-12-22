import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import publicPagesRoutes from "./publicPages.routes.js";

router.use("/api", healthRoutes);
router.use("/api/public-pages", publicPagesRoutes);
router.use("/api/auth", authRoutes);

export default router;