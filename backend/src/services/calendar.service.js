import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const getDayCalendar = async (dateString, userId) => {
    if (!dateString) {
        dateString = new Date().toISOString().split("T")[0];
    }

    const startOfDayUTC = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDayUTC = new Date(`${dateString}T23:59:59.999Z`);

    if (isNaN(startOfDayUTC.getTime()) || isNaN(endOfDayUTC.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    // ONE QUERY : schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    recurrence: "NONE",
                    scheduleDate: { gte: startOfDayUTC, lte: endOfDayUTC }
                },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: endOfDayUTC },
                    repeatUntil: { gte: startOfDayUTC }
                }
            ]
        },
        select: {
            startTime: true,
            endTime: true,
            task: {
                select: { id: true, title: true, priority: true }
            }
        }
    });

    const daySchedules = schedules.filter(schedule => appliesOnDate(schedule, dateString));

    // ONE QUERY: completions
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: startOfDayUTC, lte: endOfDayUTC }
        }
    });

    const completedTaskIds = new Set(completions.map(completion => completion.taskId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestLocalDate = new Date(`${dateString}T00:00:00.00`);

    const userTimeZone = "Asia/Kolkata";
    const response = [];

    // Classify schedules
    for (const schedule of daySchedules) {

        const start = toZonedTime(schedule.startTime, userTimeZone);
        const end = toZonedTime(schedule.endTime, userTimeZone);


        const isCompleted = completedTaskIds.has(schedule.taskId);

        let status = "PENDING";
        if (isCompleted) status = "COMPLETED";
        else if (requestLocalDate < today) status = "MISSED";

        response.push({
            scheduleId: schedule.id,
            taskId: schedule.task.id,
            title: schedule.task.title,
            priority: schedule.task.priority,
            startTime: format(start, "HH:mm"),
            endTime: format(end, "HH:mm"),
            status
        })
    };


    return {
        date: dateString,
        schedules: response
    };

}

//Helper 
function appliesOnDate(schedule, dateString) {
    const localDate = new Date(`${dateString}T00:00:00.00`);
    const day = localDate.getDay();

    if (schedule.recurrence === "DAILY") {
        return true;
    }

    if (schedule.recurrence === "WEEKLY") {
        return schedule.repeatOnDays.includes(day);
    }

    if (schedule.recurrence === "MONTHLY") {
        return schedule.scheduleDate.getDate() === localDate.getDate()

    }

    return true;

}

export const getWeekCalendar = async (dateString, userId) => {
    if (!dateString) {
        dateString = new Date().toISOString().split("T")[0];
    }

    const baseDate = new Date(`${dateString}T00:00:00Z`);

    if (isNaN(baseDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    const { monday, sunday } = getWeekRange(baseDate);

    // ONE QUERY : schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    recurrence: "NONE",
                    scheduleDate: { gte: monday, lte: sunday }
                },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: sunday },
                    repeatUntil: { gte: monday }
                }
            ]
        },
        select: {
            startTime: true,
            endTime: true,
            task: {
                select: { id: true, title: true, priority: true }
            }
        }
    });

    // ONE QUERY: completions
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: monday, lte: sunday }
        }
    });


    const completionMap = new Map();
    completions.forEach(c => {
        const key = c.completedDate.toISOString().slice(0, 10);
        if (!completionMap.has(key)) completionMap.set(key, new Set());
        completionMap.get(key).add(c.taskId);
    });

    // Initialize week days
    const days = {};
    const cursor = new Date(monday);

    while (cursor <= sunday) {
        const key = cursor.toISOString().slice(0, 10);
        days[key] = { date: key, schedules: [] };
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Expand schedules
    for (const schedule of schedules) {
        const cursor = new Date(monday);

        while (cursor <= sunday) {
            if (!appliesOnDate(schedule, cursor)) {
                cursor.setUTCDate(cursor.getUTCDate() + 1);
                continue;
            }

            const dayKey = cursor.toISOString().slice(0, 10);
            const completed = completionMap.get(dayKey)?.has(schedule.taskId);

            let status = "PENDING";
            if (completed) status = "COMPLETED";
            else if (cursor < today) status = "MISSED";

            days[dayKey].schedules.push({
                scheduleId: schedule.id,
                taskId: schedule.task.id,
                title: schedule.task.title,
                priority: schedule.task.priority,
                startTime: formatTimeSafe(schedule.startTime),
                endTime: formatTimeSafe(schedule.endTime),
                status
            });

            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    }

    return {
        weekStart: monday.toISOString().split("T")[0],
        weekEnd: sunday.toISOString().split("T")[0],
        days: Object.values(days)
    }
}

// Helper for getWeekCalendar
function getWeekRange(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return { monday, sunday };
}

export const getMonthCalendar = async (year, month, userId) => {
    if (!year || !month) {
        const now = new Date();
        year = now.getUTCFullYear();
        month = now.getUTCMonth() + 1;
    }

    const { monthStart, monthEnd } = getMonthRange(year, month);

    // ONE QUERY : schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    recurrence: "NONE",
                    scheduleDate: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                },
                {
                    recurrence: {
                        not: "NONE"
                    },
                    scheduleDate: {
                        lte: monthEnd
                    },
                    repeatUntil: {
                        gte: monthStart
                    }
                }
            ]
        },
        select: {
            startTime: true,
            endTime: true,
            task: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                }
            }
        },
        orderBy: [
            { scheduleDate: "asc" },
            { startTime: "asc" }
        ]
    });

    // ONE QUERY: completions
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: {
                gte: monthStart,
                lte: monthEnd
            }
        }
    });

    const completionMap = new Map();
    completions.forEach(c => {
        const key = c.completedDate.toISOString().split("T")[0];
        if (!completionMap.has(key)) {
            completionMap.set(key, new Set());
        }
        completionMap.get(key).add(c.taskId);
    });

    // Initialize Days
    const days = {};
    const cursor = new Date(monthStart);

    while (cursor <= monthEnd) {
        const key = cursor.toISOString().split("T")[0];

        days[key] = {
            date: key,
            schedules: []
        };
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exapand Schedules in to days
    for (const schedule of schedules) {
        const cursor = new Date(monthStart);

        while (cursor <= monthEnd) {
            if (!appliesOnDate(schedule, cursor)) {
                cursor.setUTCDate(cursor.getUTCDate() + 1);
                continue;
            }
            const dayKey = cursor.toISOString().split("T")[0];
            const completed = completionMap.get(dayKey)?.has(schedule.taskId);

            let status = "PENDING";
            if (completed) status = "COMPLETED";
            else if (cursor < today) status = "MISSED";

            if (!schedule.startTime || !schedule.endTime) {
                continue;
            }

            days[dayKey].schedules.push({
                scheduleId: schedule.id,
                taskId: schedule.task.id,
                title: schedule.task.title,
                priority: schedule.task.priority,
                startTime: formatTimeSafe(schedule.startTime),
                endTime: formatTimeSafe(schedule.endTime),
                status
            });

            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

    }
    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
}

// Helper for getMonthCalendar
const getMonthRange = (year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    end.setHours(23, 59, 59, 999);
    return {
        monthStart: start,
        monthEnd: end
    }
}

function formatTimeSafe(time) {
    if (!time || !(time instanceof Date)) return null;
    return format(time, "HH:mm");
}