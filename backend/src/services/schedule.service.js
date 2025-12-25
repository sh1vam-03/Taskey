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

    // Normalize time
    const normalizeStartTime = new Date(`1970-01-01T${startTime}:00`);
    const normalizeEndTime = new Date(`1970-01-01T${endTime}:00`);

    if (isNaN(normalizeStartTime.getTime()) || isNaN(normalizeEndTime.getTime())) {
        throw new ApiError(400, "Invalid startTime or endTime format (HH:mm required)");
    }

    // Validate time
    if (normalizeStartTime >= normalizeEndTime) {
        throw new ApiError(400, "End time must be greater than start time");
    }

    // Normalize RepeatUntil
    const normalizeRepeatUntil = repeatUntil ? new Date(`${repeatUntil}T23:59:59`) : null;


    // Check for time conflicts
    const existingSchedule = await prisma.schedule.findMany({
        where: {
            userId,
            scheduleDate: new Date(scheduleDate)
        }
    });

    for (const schedule of existingSchedule) {
        if (hasTimeConflict(schedule, normalizeStartTime, normalizeEndTime)) {
            throw new ApiError(409,
                `Schedule conflict with existing "${task.title}" - (${schedule.startTime} - ${schedule.endTime})`);
        }
    }

    // Duplicate were to check the schedule is already exists or not
    const duplicateWhere = {
        userId,
        taskId,
        scheduleDate: new Date(scheduleDate),
        startTime: normalizeStartTime,
        endTime: normalizeEndTime,
        recurrence,
        repeatUntil: normalizeRepeatUntil,
    }

    // Only include repeatOnDays if recurrence is WEEKLY
    if (recurrence === "WEEKLY") {
        duplicateWhere.repeatOnDays = {
            equals: repeatOnDays
        };
    }

    // Duplicate check
    const Duplicate = await prisma.schedule.findFirst({
        where: duplicateWhere
    });

    if (Duplicate) {
        throw new ApiError(409, "Schedule already exists");
    }

    // Create a schedule
    const schedule = await prisma.schedule.create({
        data: {
            scheduleDate: new Date(scheduleDate),
            startTime: normalizeStartTime,
            endTime: normalizeEndTime,
            recurrence,
            repeatUntil: normalizeRepeatUntil,
            repeatOnDays: repeatOnDays ?? [],
            userId,
            taskId
        }
    });
    return schedule;
};

// Get All Schedules and Task Schedules
export const getSchedules = async (userId, from, to, taskId) => {

    const where = {
        userId,
    };

    if (taskId) {
        where.taskId = taskId;
    }

    if (from && to) {
        where.scheduleDate = {};
        if (from) {
            where.scheduleDate.gte = new Date(from);
        }
        if (to) {
            where.scheduleDate.lte = new Date(to);
        }
    }

    const schedules = await prisma.schedule.findMany({
        where,
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    }
                }
            }
        }, orderBy: [
            {
                scheduleDate: "asc"
            },
            {
                startTime: "asc"
            }
        ]
    });
    return schedules;
};


// Update schedule
export const updateSchedule = async (userId, scheduleId, data) => {
    const {
        scheduleDate,
        startTime,
        endTime,
        recurrence,
        repeatUntil,
        repeatOnDays,
        notes
    } = data;

    // Fetch schedule
    const existing = await prisma.schedule.findFirst({
        where: {
            id: scheduleId,
            userId
        }
    });

    if (!existing) {
        throw new ApiError(404, "Schedule not found");
    }

    // Normalize time
    const normalizeStartTime = new Date(`1970-01-01T${startTime}:00`);
    const normalizeEndTime = new Date(`1970-01-01T${endTime}:00`);

    if (isNaN(normalizeStartTime.getTime()) || isNaN(normalizeEndTime.getTime())) {
        throw new ApiError(400, "Invalid startTime or endTime format (HH:mm required)");
    }

    // Validate time
    if (normalizeStartTime >= normalizeEndTime) {
        throw new ApiError(400, "End time must be greater than start time");
    }

    // Normalize RepeatUntil
    const normalizeRepeatUntil = repeatUntil ? new Date(`${repeatUntil}T23:59:59`) : null;


    // Check for time conflicts
    const existingSchedule = await prisma.schedule.findMany({
        where: {
            userId,
            scheduleDate: new Date(scheduleDate),
            NOT: {
                id: scheduleId
            },
        },
        include: {
            task: {
                select: { title: true }
            }
        }
    });

    for (const schedule of existingSchedule) {
        if (hasTimeConflict(schedule, normalizeStartTime, normalizeEndTime)) {
            throw new ApiError(409,
                `Schedule conflict with existing "${schedule.task.title}" - (${schedule.startTime} - ${schedule.endTime})`);
        }
    }

    // Duplicate where to check the schedule is already exists or not
    const duplicateWhere = {
        userId,
        taskId: existing.taskId,
        scheduleDate: new Date(scheduleDate),
        startTime: normalizeStartTime,
        endTime: normalizeEndTime,
        recurrence,
        repeatUntil: normalizeRepeatUntil,
        NOT: {
            id: scheduleId
        }
    }

    // Only include repeatOnDays if recurrence is WEEKLY
    if (recurrence === "WEEKLY") {
        duplicateWhere.repeatOnDays = {
            equals: repeatOnDays
        };
    }

    // Duplicate check
    const Duplicate = await prisma.schedule.findFirst({
        where: duplicateWhere
    });

    if (Duplicate) {
        throw new ApiError(409, "Schedule already exists");
    }

    // Upadate the schedule
    const schedule = await prisma.schedule.update({
        where: {
            id: scheduleId,
        },
        data: {
            scheduleDate: new Date(scheduleDate),
            startTime: normalizeStartTime,
            endTime: normalizeEndTime,
            recurrence,
            repeatUntil: normalizeRepeatUntil,
            repeatOnDays: repeatOnDays ?? [],
            notes,
        }
    });

    return schedule;
};


export const deleteSchedule = async (userId, scheduleId) => {

    // Find schedule owner
    const schedule = await prisma.schedule.findFirst({
        where: {
            id: scheduleId,
            userId
        }
    });

    if (!schedule) {
        throw new ApiError(404, "Schedule not found");
    }

    // Delete the schedule
    await prisma.schedule.delete({
        where: {
            id: scheduleId,
        }
    });
    return "Schedule deleted successfully";
};


// Helpers
const hasTimeConflict = (existing, startTime, endTime) => {
    return (
        existing.startTime < endTime &&
        startTime < existing.endTime
    );
};
