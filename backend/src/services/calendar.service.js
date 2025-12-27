import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { isAfter, isBefore, isEqual } from "date-fns";

/* -------------------- HELPERS -------------------- */

const normalizeDate = (dateString) => {
    const d = new Date(`${dateString}T00:00:00Z`);
    if (isNaN(d)) throw new ApiError(400, "Invalid date");
    return d;
};

const startOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const formatTime = (time) =>
    time ? time.toISOString().slice(11, 16) : null;

const todayUTC = () => {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

/* -------------------- RECURRENCE -------------------- */

const appliesOnDate = (schedule, date) => {
    const sDate = startOfDay(schedule.scheduleDate);
    const cDate = startOfDay(date);

    if (cDate < sDate) return false;
    if (schedule.repeatUntil && cDate > schedule.repeatUntil) return false;

    switch (schedule.recurrence) {
        case "NONE":
            return cDate.getTime() === sDate.getTime();
        case "DAILY":
            return true;
        case "WEEKLY":
            return schedule.repeatOnDays.includes(cDate.getUTCDay());
        case "MONTHLY":
            return cDate.getUTCDate() === sDate.getUTCDate();
        default:
            return false;
    }
};

/* ======================================================
   DAY CALENDAR
====================================================== */

export const getDayCalendar = async (dateString, userId) => {
    const date = normalizeDate(dateString);
    const dayKey = date.toISOString().slice(0, 10);
    const today = todayUTC();

    /* Schedules */
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
        include: { task: true },
        orderBy: { startTime: "asc" }
    });

    /* Completion & missed */
    const [completed, missed] = await Promise.all([
        prisma.scheduleCompletion.findMany({
            where: { userId, completedOn: date }
        }),
        prisma.missedSchedule.findMany({
            where: { userId, missedOn: date }
        })
    ]);

    const completedSet = new Set(completed.map(c => c.scheduleId));
    const missedSet = new Set(missed.map(m => m.scheduleId));

    /* UNSCHEDULED TASKS – ONLY CREATED DAY */
    const tasks = await prisma.task.findMany({
        where: {
            userId,
            deletedAt: null,
            schedules: { none: {} },
            createdAt: {
                gte: date,
                lt: new Date(date.getTime() + 86400000)
            }
        }
    });

    const dailyCompletions = await prisma.taskDailyCompletion.findMany({
        where: { userId, completedDate: date }
    });

    const dailyCompletedSet = new Set(dailyCompletions.map(c => c.taskId));

    return {
        date: dayKey,
        items: [
            ...schedules
                .filter(s => appliesOnDate(s, date))
                .map(s => ({
                    type: "SCHEDULED",
                    scheduleId: s.id,
                    taskId: s.taskId,
                    title: s.task.title,
                    priority: s.task.priority,
                    startTime: formatTime(s.startTime),
                    endTime: formatTime(s.endTime),
                    status: completedSet.has(s.id)
                        ? "COMPLETED"
                        : missedSet.has(s.id)
                            ? "MISSED"
                            : "PENDING"
                })),

            ...tasks.map(t => ({
                type: "UNSCHEDULED",
                taskId: t.id,
                title: t.title,
                priority: t.priority,
                startTime: null,
                endTime: null,
                status: dailyCompletedSet.has(t.id)
                    ? "COMPLETED"
                    : date < today
                        ? "MISSED"
                        : "PENDING"
            }))
        ]
    };
};


/* ======================================================
   WEEK CALENDAR
====================================================== */

export const getWeekCalendar = async (dateString, userId) => {
    const base = normalizeDate(dateString);

    /* -------------------- WEEK RANGE -------------------- */
    const day = base.getUTCDay();
    const weekStart = new Date(base);
    weekStart.setUTCDate(base.getUTCDate() - ((day + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    /* -------------------- INIT DAYS -------------------- */
    const days = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        days[d.toISOString().slice(0, 10)] = [];
    }

    /* -------------------- FETCH SCHEDULES -------------------- */
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    recurrence: "NONE",
                    scheduleDate: { gte: weekStart, lte: weekEnd }
                },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: weekEnd },
                    repeatUntil: { gte: weekStart }
                }
            ]
        },
        include: { task: true }
    });

    /* -------------------- FETCH COMPLETIONS & MISSED -------------------- */
    const [completions, missed] = await Promise.all([
        prisma.scheduleCompletion.findMany({
            where: { userId, completedOn: { gte: weekStart, lte: weekEnd } }
        }),
        prisma.missedSchedule.findMany({
            where: { userId, missedOn: { gte: weekStart, lte: weekEnd } }
        })
    ]);

    const completedMap = new Map();
    completions.forEach(c => {
        const key = c.completedOn.toISOString().slice(0, 10);
        if (!completedMap.has(key)) completedMap.set(key, new Set());
        completedMap.get(key).add(c.scheduleId);
    });

    const missedMap = new Map();
    missed.forEach(m => {
        const key = m.missedOn.toISOString().slice(0, 10);
        if (!missedMap.has(key)) missedMap.set(key, new Set());
        missedMap.get(key).add(m.scheduleId);
    });

    /* -------------------- EXPAND SCHEDULED TASKS -------------------- */
    for (const s of schedules) {
        for (const dayKey of Object.keys(days)) {
            const date = new Date(`${dayKey}T00:00:00Z`);
            if (!appliesOnDate(s, date)) continue;

            let status = "PENDING";
            if (completedMap.get(dayKey)?.has(s.id)) status = "COMPLETED";
            else if (missedMap.get(dayKey)?.has(s.id)) status = "MISSED";

            days[dayKey].push({
                type: "SCHEDULED",
                scheduleId: s.id,
                taskId: s.taskId,
                title: s.task.title,
                priority: s.task.priority,
                startTime: formatTime(s.startTime),
                endTime: formatTime(s.endTime),
                status
            });
        }
    }

    /* -------------------- UNSCHEDULED TASKS -------------------- */
    const unscheduledTasks = await prisma.task.findMany({
        where: {
            userId,
            deletedAt: null,
            schedules: { none: {} },
            createdAt: {
                gte: weekStart,
                lt: weekEnd
            }
        }
    });

    const dailyCompletions = await prisma.taskDailyCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: weekStart, lte: weekEnd }
        }
    });

    const dailyCompletedMap = new Map();
    for (const c of dailyCompletions) {
        const key = c.completedDate.toISOString().slice(0, 10);
        if (!dailyCompletedMap.has(key)) dailyCompletedMap.set(key, new Set());
        dailyCompletedMap.get(key).add(c.taskId);
    }

    const today = todayUTC();

    for (const task of unscheduledTasks) {
        const dayKey = startOfDay(task.createdAt).toISOString().slice(0, 10);
        if (!days[dayKey]) continue;

        let status = "PENDING";
        if (dailyCompletedMap.get(dayKey)?.has(task.id)) {
            status = "COMPLETED";
        } else if (new Date(dayKey) < today) {
            status = "MISSED";
        }

        days[dayKey].push({
            type: "UNSCHEDULED",
            taskId: task.id,
            title: task.title,
            priority: task.priority,
            startTime: null,
            endTime: null,
            status
        });
    }

    return {
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        days
    };
};



/* ======================================================
   MONTH CALENDAR
====================================================== */

export const getMonthCalendar = async (year, month, userId) => {
    if (!year || !month) {
        throw new ApiError(400, "year and month are required");
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    /* -------------------- INIT DAYS -------------------- */
    const days = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        days[d.toISOString().slice(0, 10)] = [];
    }

    /* -------------------- FETCH SCHEDULES -------------------- */
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    recurrence: "NONE",
                    scheduleDate: { gte: monthStart, lte: monthEnd }
                },
                {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: monthEnd },
                    repeatUntil: { gte: monthStart }
                }
            ]
        },
        include: {
            task: true
        }
    });

    /* -------------------- FETCH COMPLETIONS -------------------- */
    const [completions, missed] = await Promise.all([
        prisma.scheduleCompletion.findMany({
            where: {
                userId,
                completedOn: { gte: monthStart, lte: monthEnd }
            }
        }),
        prisma.missedSchedule.findMany({
            where: {
                userId,
                missedOn: { gte: monthStart, lte: monthEnd }
            }
        })
    ]);

    /* -------------------- MAP COMPLETIONS -------------------- */
    const completedMap = new Map();
    for (const c of completions) {
        const key = c.completedOn.toISOString().slice(0, 10);
        if (!completedMap.has(key)) completedMap.set(key, new Set());
        completedMap.get(key).add(c.scheduleId);
    }

    const missedMap = new Map();
    for (const m of missed) {
        const key = m.missedOn.toISOString().slice(0, 10);
        if (!missedMap.has(key)) missedMap.set(key, new Set());
        missedMap.get(key).add(m.scheduleId);
    }

    /* -------------------- EXPAND SCHEDULES -------------------- */
    for (const schedule of schedules) {
        for (const dayKey of Object.keys(days)) {
            const dayDate = new Date(`${dayKey}T00:00:00Z`);
            if (!appliesOnDate(schedule, dayDate)) continue;

            let status = "PENDING";
            if (completedMap.get(dayKey)?.has(schedule.id)) status = "COMPLETED";
            else if (missedMap.get(dayKey)?.has(schedule.id)) status = "MISSED";

            days[dayKey].push({
                type: "SCHEDULED",
                scheduleId: schedule.id,
                taskId: schedule.taskId,
                title: schedule.task.title,
                priority: schedule.task.priority,
                startTime: formatTime(schedule.startTime),
                endTime: formatTime(schedule.endTime),
                status
            });
        }
    }

    /* -------------------- UNSCHEDULED TASKS -------------------- */
    const unscheduledTasks = await prisma.task.findMany({
        where: {
            userId,
            deletedAt: null,
            schedules: { none: {} },
            createdAt: {
                gte: monthStart,
                lt: monthEnd
            }
        }
    });

    const dailyCompletions = await prisma.taskDailyCompletion.findMany({
        where: {
            userId,
            completedDate: { gte: monthStart, lte: monthEnd }
        }
    });

    const dailyCompletedMap = new Map();
    for (const c of dailyCompletions) {
        const key = c.completedDate.toISOString().slice(0, 10);
        if (!dailyCompletedMap.has(key)) dailyCompletedMap.set(key, new Set());
        dailyCompletedMap.get(key).add(c.taskId);
    }

    const today = todayUTC();

    for (const task of unscheduledTasks) {
        const key = startOfDay(task.createdAt).toISOString().slice(0, 10);
        if (!days[key]) continue;

        let status = "PENDING";
        if (dailyCompletedMap.get(key)?.has(task.id)) {
            status = "COMPLETED";
        } else if (new Date(key) < today) {
            status = "MISSED";
        }

        days[key].push({
            type: "UNSCHEDULED",
            taskId: task.id,
            title: task.title,
            priority: task.priority,
            startTime: null,
            endTime: null,
            status
        });
    }


    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
};
