import * as calendarService from "../services/calendar.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


export const getDayCalender = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await calendarService.getDayCalender(date, userId);

    res.status(200).json({
        success: true,
        message: "Calendar day data fetched successfully",
        data
    });
});


export const getWeekCalender = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { date } = req.query;

    const data = await calendarService.getWeekCalender(date, userId);

    res.status(200).json({
        success: true,
        message: "Calendar week data fetched successfully",
        data
    });
});

export const getMonthCalender = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { year, month } = req.query;


    const data = await calendarService.getMonthCalender(Number(year), Number(month), userId);

    res.status(200).json({
        success: true,
        message: "Calendar month data fetched successfully",
        data
    });
});