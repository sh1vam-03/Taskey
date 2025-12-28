import * as dashboardService from "../services/dashboard.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const getDashboardOverview = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const overview = await dashboardService.getDashboardOverview(userId);

    res.status(200).json({
        success: true,
        message: "Dashboard overview fetched successfully",
        data: overview
    });
});

export const getTodayDashboard = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const todayDashboard = await dashboardService.getTodayDashboard(userId);

    res.status(200).json({
        success: true,
        message: "Today's dashboard fetched successfully",
        data: todayDashboard
    });
});