import * as calendarService from "../services/calendar.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


export const getDayCalendar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await calendarService.getDayCalendar(date, userId);

    res.status(200).json({
        success: true,
        message: "Calendar day data fetched successfully",
        data
    });
});


export const getWeekCalendar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await calendarService.getWeekCalendar(date, userId);

    res.status(200).json({
        success: true,
        message: "Calendar week data fetched successfully",
        data
    });
});

export const getMonthCalendar = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { year, month } = req.query;


    const data = await calendarService.getMonthCalendar(Number(year), Number(month), userId);

    res.status(200).json({
        success: true,
        message: "Calendar month data fetched successfully",
        data
    });
});