import * as dashboardService from "../services/dashboard.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * @routes GET /api/dashboard/overview
 * @desc Get dashboard overview
 * @access Private
 */
export const getDashboardOverview = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const data = await dashboardService.getDashboardOverview(userId);

    res.status(200).json({
        success: true,
        message: "Dashboard overview fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/today
 * @desc Get today's dashboard
 * @access Private
 */
export const getTodayDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const data = await dashboardService.getTodayDashboard(userId);

    res.status(200).json({
        success: true,
        message: "Today's dashboard fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/weekly?date=YYYY-MM-DD
 * @desc Get weekly dashboard
 * @access Private
 */
export const getWeeklyDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await dashboardService.getWeeklyDashboard(
        userId,
        date || new Date().toISOString().slice(0, 10)
    );

    res.status(200).json({
        success: true,
        message: "Weekly dashboard fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/monthly?year=YYYY&month=MM
 * @desc Get monthly dashboard
 * @access Private
 */
export const getMonthlyDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { year, month } = req.query;

    const data = await dashboardService.getMonthlyDashboard(
        userId,
        Number(year),
        Number(month)
    );

    res.status(200).json({
        success: true,
        message: "Monthly dashboard fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/streaks
 * @desc Get streak overview
 * @access Private
 */
export const getStreakOverview = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const data = await dashboardService.getStreakOverview(userId);

    res.status(200).json({
        success: true,
        message: "Streak overview fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/streak-calendar?days=90
 * @desc Get streak calendar
 * @access Private
 */
export const getStreakCalendar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const days = Number(req.query.days) || 90;

    const data = await dashboardService.getStreakCalendar(userId, days);

    res.status(200).json({
        success: true,
        message: "Streak calendar fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/performance/daily?date=YYYY-MM-DD
 * @desc Get daily performance
 * @access Private
 */
export const getDailyPerformance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await dashboardService.getDailyPerformance(
        userId,
        date ? new Date(date) : new Date()
    );

    res.status(200).json({
        success: true,
        message: "Daily performance fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/performance/weekly?date=YYYY-MM-DD
 * @desc Get weekly performance
 * @access Private
 */
export const getWeeklyPerformance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await dashboardService.getWeeklyPerformance(
        userId,
        date ? new Date(date) : new Date()
    );

    res.status(200).json({
        success: true,
        message: "Weekly performance fetched successfully",
        data
    });
});

/**
 * @routes GET /api/dashboard/performance/monthly?year=YYYY&month=MM
 * @desc Get monthly performance
 * @access Private
 */
export const getMonthlyPerformance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { year, month } = req.query;

    const data = await dashboardService.getMonthlyPerformance(
        userId,
        Number(year),
        Number(month)
    );

    res.status(200).json({
        success: true,
        message: "Monthly performance fetched successfully",
        data
    });
});


