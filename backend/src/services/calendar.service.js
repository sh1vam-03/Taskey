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
    const scheduleDate = startOfDay(schedule.scheduleDate);
    const checkDate = startOfDay(date);

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

/* ======================================================
   DAY CALENDAR
====================================================== */

export const getDayCalendar = async (dateString, userId) => {
    const date = normalizeDate(dateString);
    const dayKey = date.toISOString().slice(0, 10);
    const today = todayUTC();

    /* 1️⃣ Scheduled tasks */
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

    /* 2️⃣ Schedule completions & missed */
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

    /* 3️⃣ Unscheduled (daily) tasks */
    const tasks = await prisma.task.findMany({
        where: {
            userId,
            deletedAt: null,
            schedules: { none: {} }
        }
    });

    const taskCompletions = await prisma.taskDailyCompletion.findMany({
        where: { userId, completedDate: date }
    });

    const taskCompletedSet = new Set(taskCompletions.map(t => t.taskId));

    return {
        date: dayKey,
        schedules: [
            /* Scheduled tasks */
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

            /* Unscheduled daily tasks */
            ...tasks.map(t => ({
                type: "UNSCHEDULED",
                taskId: t.id,
                title: t.title,
                priority: t.priority,
                startTime: null,
                endTime: null,
                status: taskCompletedSet.has(t.id)
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
    const baseDate = normalizeDate(dateString);
    const day = baseDate.getUTCDay();
    const weekStart = new Date(baseDate);
    weekStart.setUTCDate(baseDate.getUTCDate() - ((day + 6) % 7));
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const days = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        days[d.toISOString().slice(0, 10)] = await getDayCalendar(
            d.toISOString().slice(0, 10),
            userId
        );
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
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const days = {};
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        days[d.toISOString().slice(0, 10)] = await getDayCalendar(
            d.toISOString().slice(0, 10),
            userId
        );
    }

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
};
