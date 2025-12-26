import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { isAfter, isBefore, isEqual } from "date-fns";


export const getDayCalendar = async (dateString, userId) => {
    const date = normalizeDate(dateString);

    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                { recurrence: "NONE", scheduleDate: date },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: date },
                    repeatUntil: { gte: date }
                }
            ]
        },
        include: {
            task: { select: { id: true, title: true, priority: true } }
        },
        orderBy: { startTime: "asc" }
    });

    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: date
        }
    });

    const completedSet = new Set(completions.map(c => c.taskId));

    return {
        date: dateString,
        schedules: schedules
            .filter(s => appliesOnDate(s, date))
            .map(s => ({
                scheduleId: s.id,
                taskId: s.task.id,
                title: s.task.title,
                priority: s.task.priority,
                startTime: formatTime(s.startTime),
                endTime: formatTime(s.endTime),
                status: completedSet.has(s.taskId) ? "COMPLETED" : "PENDING"
            }))
    };
};


export const getWeekCalendar = async (dateString, userId) => {
    const baseDate = normalizeDate(dateString);
    const { weekStart, weekEnd } = getWeekRange(baseDate);

    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                { recurrence: "NONE", scheduleDate: { gte: weekStart, lte: weekEnd } },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: weekEnd },
                    repeatUntil: { gte: weekStart }
                }
            ]
        },
        include: {
            task: { select: { id: true, title: true, priority: true } }
        }
    });

    const days = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days[key] = [];
    }

    for (const schedule of schedules) {
        for (const dayKey of Object.keys(days)) {
            const dayDate = new Date(`${dayKey}T00:00:00Z`);
            if (appliesOnDate(schedule, dayDate)) {
                days[dayKey].push({
                    taskId: schedule.task.id,
                    title: schedule.task.title,
                    startTime: formatTime(schedule.startTime),
                    endTime: formatTime(schedule.endTime)
                });
            }
        }
    }

    return { weekStart, weekEnd, days };
};


export const getMonthCalendar = async (year, month, userId) => {
    const { monthStart, monthEnd } = getMonthRange(year, month);

    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                { recurrence: "NONE", scheduleDate: { gte: monthStart, lte: monthEnd } },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: monthEnd },
                    repeatUntil: { gte: monthStart }
                }
            ]
        },
        include: {
            task: { select: { id: true, title: true, priority: true } }
        }
    });

    const days = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days[key] = [];
    }

    for (const schedule of schedules) {
        for (const key of Object.keys(days)) {
            const dayDate = new Date(`${key}T00:00:00Z`);
            if (appliesOnDate(schedule, dayDate)) {
                days[key].push({
                    taskId: schedule.task.id,
                    title: schedule.task.title,
                    startTime: formatTime(schedule.startTime),
                    endTime: formatTime(schedule.endTime)
                });
            }
        }
    }

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
};


/**
 * Check if schedule applies on a given date
 * @param {Object} schedule - The schedule row from the database
 * @param {Date} date - The date being evaluated (UTC, Start of day)
 * @returns {boolean} - True if the schedule applies on the given date, false otherwise
 */

const appliesOnDate = (schedule, date) => {
    const scheduleDate = startOfDay(schedule.scheduleDate);
    const checkDate = startOfDay(date);

    // Outside recurrence window
    if (isBefore(checkDate, scheduleDate)) return false;
    if (schedule.repeatUntil && isAfter(checkDate, schedule.repeatUntil)) return false;

    switch (schedule.recurrence) {
        case "NONE":
            return isEqual(checkDate, scheduleDate);

        case "DAILY":
            return true;

        case "WEEKLY":
            return schedule.repeatOnDays.includes(checkDate.getUTCDay());

        case "MONTHLY":
            return checkDate.getUTCDate() === scheduleDate.getUTCDate();

        default:
            return false;
    }
};

const startOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};


// helpers

const normalizeDate = (dateString) => {
    const d = new Date(`${dateString}T00:00:00Z`);
    if (isNaN(d)) throw new ApiError(400, "Invalid date");
    return d;
};

const formatTime = (time) => {
    if (!time) return null;
    return time.toISOString().slice(11, 16); // HH:mm
};

const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return { weekStart: monday, weekEnd: sunday };
};

const getMonthRange = (year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { monthStart: start, monthEnd: end };
};
