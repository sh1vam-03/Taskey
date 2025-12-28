import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/overview", authMiddleware, dashboardController.getDashboardOverview);

export default router;
