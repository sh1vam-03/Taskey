import express from "express";
const router = express.Router();

import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";

router.use("/api/health", healthRoutes);
router.use("/api/auth", authRoutes);

export default router;