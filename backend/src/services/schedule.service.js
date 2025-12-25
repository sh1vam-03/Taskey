import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

// Create Schedule
export const createSchedule = async (data) => {
    const {
        userId,
        taskId,
        scheduleDate,
        startTime,
        endTime,
        recurrence,
        repeatUntil,
        repeatOnDays
    } = data;

    // Check task owner
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId
        }
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Validate time
    if (startTime >= endTime) {
        throw new ApiError(400, "End time must be greater than start time");
    }

    // Normalize RepeatUntil
    const normalizeRepeatUntil = repeatUntil ? new Date(`${repeatUntil}T23:59:59`) : null;


    console.log({
        recurrence,
        repeatUntil,
        normalizeRepeatUntil
    });


    // Recurrence Validation
    if (recurrence !== "NONE") {
        if (!normalizeRepeatUntil) {
            throw new ApiError(400, "repeatUntil required for recurrence");
        }
    }

    if (normalizeRepeatUntil && isNaN(normalizeRepeatUntil.getTime())) {
        throw new ApiError(400, "Invalid repeatUntil date");
    }

    if (recurrence === "WEEKLY" && (!repeatOnDays || repeatOnDays.length === 0)) {
        throw new ApiError(400, "repeatOnDays required for weekly recurrence");
    }

    // Create a schedule
    const schedule = await prisma.schedule.create({
        data: {
            scheduleDate: new Date(scheduleDate),
            startTime: new Date(`1970-01-01T${startTime}:00`),
            endTime: new Date(`1970-01-01T${endTime}:00`),
            recurrence,
            repeatUntil: repeatUntil ? new Date(repeatUntil) : null,
            repeatOnDays,
            userId,
            taskId
        }
    });
    return schedule;
};