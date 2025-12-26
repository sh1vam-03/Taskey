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
            completedDate: { gte: date, lte: date }
        },
        select: {
            taskId: true,
            completedDate: true,
            completedAt: true
        }
    });


    const completionMap = new Map();

    /*
     Map structure:
     {
       "2025-12-25" => Map(taskId => completedAt)
     }
    */

    for (const c of completions) {
        const dateKey = c.completedDate.toISOString().slice(0, 10);

        if (!completionMap.has(dateKey)) {
            completionMap.set(dateKey, new Map());
        }

        completionMap.get(dateKey).set(c.taskId, c.completedAt);
    }



    const dayKey = date.toISOString().slice(0, 10);

    return {
        date: dateString,
        schedules: schedules
            .filter(schedule => appliesOnDate(schedule, date))
            .map(schedule => {
                const completedAt =
                    completionMap.get(dayKey)?.get(schedule.taskId) ?? null;

                let status = "PENDING";
                if (completedAt) status = "COMPLETED";
                else if (date < todayUTC()) status = "MISSED";

                return {
                    scheduleId: schedule.id,
                    taskId: schedule.task.id,
                    title: schedule.task.title,
                    priority: schedule.task.priority,
                    startTime: formatTime(schedule.startTime),
                    endTime: formatTime(schedule.endTime),
                    status,
                    completedAt
                };
            })
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

    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: weekStart, lte: weekEnd }
        },
        select: {
            taskId: true,
            completedDate: true,
            completedAt: true
        }
    });


    const completionMap = new Map();

    /*
     Map structure:
     {
       "2025-12-25" => Map(taskId => completedAt)
     }
    */

    for (const c of completions) {
        const dateKey = c.completedDate.toISOString().slice(0, 10);

        if (!completionMap.has(dateKey)) {
            completionMap.set(dateKey, new Map());
        }

        completionMap.get(dateKey).set(c.taskId, c.completedAt);
    }


    const days = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days[key] = [];
    }

    for (const schedule of schedules) {
        for (const dayKey of Object.keys(days)) {
            const dayDate = new Date(`${dayKey}T00:00:00Z`);
            if (appliesOnDate(schedule, dayDate)) {
                const completedAt =
                    completionMap.get(dayKey)?.get(schedule.taskId) ?? null;

                let status = "PENDING";
                if (completedAt) status = "COMPLETED";
                else if (dayDate < todayUTC()) status = "MISSED";

                days[dayKey].push({
                    scheduleId: schedule.id,
                    taskId: schedule.task.id,
                    title: schedule.task.title,
                    priority: schedule.task.priority,
                    startTime: formatTime(schedule.startTime),
                    endTime: formatTime(schedule.endTime),
                    status,
                    completedAt
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

    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: monthStart, lte: monthEnd }
        },
        select: {
            taskId: true,
            completedDate: true,
            completedAt: true
        }
    });


    const completionMap = new Map();

    /*
     Map structure:
     {
       "2025-12-25" => Map(taskId => completedAt)
     }
    */

    for (const c of completions) {
        const dateKey = c.completedDate.toISOString().slice(0, 10);

        if (!completionMap.has(dateKey)) {
            completionMap.set(dateKey, new Map());
        }

        completionMap.get(dateKey).set(c.taskId, c.completedAt);
    }


    const days = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days[key] = [];
    }

    for (const schedule of schedules) {
        for (const key of Object.keys(days)) {
            const dayDate = new Date(`${key}T00:00:00Z`);
            if (appliesOnDate(schedule, dayDate)) {
                const dayKey = dayDate.toISOString().slice(0, 10);
                const completedAt = completionMap.get(dayKey)?.get(schedule.taskId) ?? null;

                let status = "PENDING";
                if (completedAt) status = "COMPLETED";
                else if (dayDate < todayUTC()) status = "MISSED";
                days[key].push({
                    scheduleId: schedule.id,
                    taskId: schedule.task.id,
                    title: schedule.task.title,
                    priority: schedule.task.priority,
                    startTime: formatTime(schedule.startTime),
                    endTime: formatTime(schedule.endTime),
                    status,
                    completedAt
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

function todayUTC() {
    const now = new Date();
    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
}


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
