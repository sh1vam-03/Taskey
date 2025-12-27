import * as service from "../services/scheduleCompletion.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const completeSchedule = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    const data = await service.completeSchedule(id, userId);

    res.status(201).json({
        success: true,
        message: "Schedule marked as completed",
        data
    });
});

export const undoCompleteSchedule = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;

    await service.undoCompleteSchedule(id, userId);

    res.json({
        success: true,
        message: "Schedule completion undone"
    });
});

export const completeBulk = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { scheduleIds } = req.body;

    if (!Array.isArray(scheduleIds) || !scheduleIds.length) {
        throw new ApiError(400, "scheduleIds must be a non-empty array");
    }

    const result = await service.completeBulk(scheduleIds, userId);

    res.status(201).json({
        success: true,
        message: "Schedules completed successfully",
        data: result
    });
});

export const getCompletionHistory = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const history = await service.getCompletionHistory(userId);

    res.json({
        success: true,
        data: history
    });
});
