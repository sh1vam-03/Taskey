import * as scheduleService from "../services/schedule.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { nextDay } from "date-fns";

/**
 * @route POST /api/schedules
 * @desc Create a new schedule
 * @access Private
 */
export const createSchedule = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { taskId, scheduleDate, startTime, endTime, recurrence = "NONE", repeatUntil, repeatOnDays } = req.body;

    if (!taskId || !scheduleDate || !startTime || !endTime) {
        throw new ApiError(400, "Required fields are missing");
    }

    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

    if (!ISO_DATE_REGEX.test(scheduleDate)) {
        throw new ApiError(400, "scheduleDate must be YYYY-MM-DD");
    }

    // Validation check for one time task schedule
    if (recurrence === "NONE") {
        if (repeatUntil) {
            throw new ApiError(400, "repeatUntil is not required for one time task");
        }

        if (repeatOnDays?.length) {
            throw new ApiError(400, "repeatOnDays is not required for one time task");
        }
    }

    // Validation check for daily task schedule
    if (recurrence === "DAILY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for daily task");
        }

        if (repeatOnDays?.length) {
            throw new ApiError(400, "repeatOnDays is required for daily task");
        }
    }

    // Validation check for weekly task schedule
    if (recurrence === "WEEKLY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for weekly task");
        }

        if (!repeatOnDays || repeatOnDays.length === 0) {
            throw new ApiError(400, "repeatOnDays is required for weekly task");
        }

        for (const day of repeatOnDays) {
            if (day < 1 || day > 7) {
                throw new ApiError(400, "Invalid day of week");
            }
        }
    }

    // Validation check for monthly task schedule
    if (recurrence === "MONTHLY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for monthly task");
        }

        if (repeatOnDays && repeatOnDays.length > 0) {
            throw new ApiError(400, "repeatOnDays is not required for monthly task");
        }
    }

    const schedule = await scheduleService.createSchedule({
        userId,
        taskId,
        scheduleDate,
        startTime,
        endTime,
        recurrence,
        repeatUntil,
        repeatOnDays
    });
    res.status(201).json({
        success: true,
        message: "Schedule created successfully",
        data: schedule
    });
});

/**
 * @route GET /api/schedules
 * @desc Get All Schedules and Task Schedules
 * @access Private
 */

export const getSchedules = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { from, to, taskId } = req.query;

    if (from || to) {
        if (from > to) {
            throw new ApiError(400, "from must be less than to");
        }
    }

    const schedules = await scheduleService.getSchedules(userId, from, to, taskId);

    res.status(200).json({
        success: true,
        message: "Schedules retrieved successfully",
        data: schedules
    });
});


/**
 * @route PUT /api/schedules/:id
 * @desc Update a schedule
 * @access Private
 */
export const updateSchedule = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const scheduleId = req.params.id;
    const { scheduleDate, startTime, endTime, recurrence = "NONE", repeatUntil, repeatOnDays, notes } = req.body;

    if (!scheduleDate || !startTime || !endTime) {
        throw new ApiError(400, "Required fields are missing");
    }

    const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

    if (!ISO_DATE_REGEX.test(scheduleDate)) {
        throw new ApiError(400, "scheduleDate must be YYYY-MM-DD");
    }

    // Validation check for one time task schedule
    if (recurrence === "NONE") {
        if (repeatUntil) {
            throw new ApiError(400, "repeatUntil is not required for one time task");
        }

        if (repeatOnDays?.length) {
            throw new ApiError(400, "repeatOnDays is not required for one time task");
        }
    }

    // Validation check for daily task schedule
    if (recurrence === "DAILY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for daily task");
        }

        if (repeatOnDays?.length) {
            throw new ApiError(400, "repeatOnDays is required for daily task");
        }
    }

    // Validation check for weekly task schedule
    if (recurrence === "WEEKLY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for weekly task");
        }

        if (!repeatOnDays || repeatOnDays.length === 0) {
            throw new ApiError(400, "repeatOnDays is required for weekly task");
        }

        for (const day of repeatOnDays) {
            if (day < 1 || day > 7) {
                throw new ApiError(400, "Invalid day of week");
            }
        }
    }

    // Validation check for monthly task schedule
    if (recurrence === "MONTHLY") {
        if (!repeatUntil) {
            throw new ApiError(400, "repeatUntil is required for monthly task");
        }

        if (repeatOnDays && repeatOnDays.length > 0) {
            throw new ApiError(400, "repeatOnDays is not required for monthly task");
        }
    }


    const schedule = await scheduleService.updateSchedule(
        userId,
        scheduleId,
        {
            scheduleDate,
            startTime,
            endTime,
            recurrence,
            repeatUntil,
            repeatOnDays,
            notes
        });

    res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: schedule
    });
});
