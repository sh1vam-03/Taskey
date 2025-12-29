import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";


export const getDashboardOverview = async (userId) => {
    const today = startOfUTCDate();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    /* ---------- 1️⃣ Fetch all relevant data ---------- */

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyCompletions
    ] = await Promise.all([

        prisma.schedule.findMany({
            where: {
                userId,
                scheduleDate: { lte: today },
                OR: [
                    { repeatUntil: null },
                    { repeatUntil: { gte: today } }
                ]
            }
        }),

        prisma.scheduleCompletion.findMany({
            where: { userId, completedOn: today }
        }),

        prisma.missedSchedule.findMany({
            where: { userId, missedOn: today }
        }),

        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: today, lt: tomorrow }
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: { userId, completedDate: today }
        })
    ]);

    /* ---------- 2️⃣ Build lookup sets ---------- */

    const completedScheduleSet = new Set(
        scheduleCompletions.map(c => c.scheduleId)
    );

    const missedScheduleSet = new Set(
        missedSchedules.map(m => m.scheduleId)
    );

    const completedTaskSet = new Set(
        dailyCompletions.map(c => c.taskId)
    );

    /* ---------- 3️⃣ Count scheduled tasks ---------- */

    let scheduledTotal = 0;
    let scheduledCompleted = 0;
    let scheduledMissed = 0;

    for (const s of schedules) {
        if (!appliesOnDate(s, today)) continue;

        scheduledTotal++;

        if (completedScheduleSet.has(s.id)) scheduledCompleted++;
        else if (missedScheduleSet.has(s.id)) scheduledMissed++;
    }

    /* ---------- 4️⃣ Count unscheduled tasks ---------- */

    const unscheduledTotal = unscheduledTasks.length;
    let unscheduledCompleted = 0;

    for (const t of unscheduledTasks) {
        if (completedTaskSet.has(t.id)) unscheduledCompleted++;
    }

    /* ---------- 5️⃣ Final aggregation ---------- */

    const totalTasks = scheduledTotal + unscheduledTotal;
    const completedTasks = scheduledCompleted + unscheduledCompleted;
    const missedTasks = scheduledMissed;
    const pendingTasks = Math.max(
        totalTasks - completedTasks - missedTasks,
        0
    );

    return {
        today: {
            totalTasks,
            completedTasks,
            missedTasks,
            pendingTasks
        }
    };
};

export const getTodayDashboard = async (userId) => {
    const today = startOfUTCDate();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    /* ------------------ FETCH DATA (PARALLEL) ------------------ */

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyTaskCompletions
    ] = await Promise.all([
        prisma.schedule.findMany({
            where: {
                userId,
                OR: [
                    { recurrence: "NONE", scheduleDate: today },
                    {
                        recurrence: { not: "NONE" },
                        scheduleDate: { lte: today },
                        repeatUntil: { gte: today }
                    }
                ]
            },
            include: { task: true },
            orderBy: { startTime: "asc" }
        }),

        prisma.scheduleCompletion.findMany({
            where: { userId, completedOn: today },
            select: { scheduleId: true }
        }),

        prisma.missedSchedule.findMany({
            where: { userId, missedOn: today },
            select: { scheduleId: true }
        }),

        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: today, lt: tomorrow }
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: { userId, completedDate: today },
            select: { taskId: true }
        })
    ]);

    /* ------------------ MAPS (FAST LOOKUPS) ------------------ */

    const completedScheduleSet = new Set(
        scheduleCompletions.map(c => c.scheduleId)
    );

    const missedScheduleSet = new Set(
        missedSchedules.map(m => m.scheduleId)
    );

    const completedTaskSet = new Set(
        dailyTaskCompletions.map(c => c.taskId)
    );

    /* ------------------ BUILD TIMELINE ------------------ */

    const timeline = [];

    // Scheduled
    for (const s of schedules) {
        if (!appliesOnDate(s, today)) continue;

        let status = "PENDING";
        if (completedScheduleSet.has(s.id)) status = "COMPLETED";
        else if (missedScheduleSet.has(s.id)) status = "MISSED";

        timeline.push({
            type: "SCHEDULED",
            scheduleId: s.id,
            taskId: s.taskId,
            title: s.task.title,
            priority: s.task.priority,
            startTime: s.startTime?.toISOString().slice(11, 16),
            endTime: s.endTime?.toISOString().slice(11, 16),
            status
        });
    }

    // Unscheduled
    for (const t of unscheduledTasks) {
        timeline.push({
            type: "UNSCHEDULED",
            taskId: t.id,
            title: t.title,
            priority: t.priority,
            startTime: null,
            endTime: null,
            status: completedTaskSet.has(t.id) ? "COMPLETED" : "PENDING"
        });
    }

    /* ------------------ STATS ------------------ */

    const stats = {
        total: timeline.length,
        completed: timeline.filter(t => t.status === "COMPLETED").length,
        missed: timeline.filter(t => t.status === "MISSED").length,
        pending: timeline.filter(t => t.status === "PENDING").length
    };

    return {
        date: dayKey(today),
        stats,
        timeline
    };
};

export const getWeeklyDashboard = async (userId, dateString) => {
    const baseDate = startOfUTCDate(new Date(dateString));
    const { weekStart, weekEnd } = getWeekRange(baseDate);

    /* ------------------ FETCH ONCE ------------------ */

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyCompletions
    ] = await Promise.all([
        prisma.schedule.findMany({
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
            }
        }),

        prisma.scheduleCompletion.findMany({
            where: {
                userId,
                completedOn: { gte: weekStart, lte: weekEnd }
            }
        }),

        prisma.missedSchedule.findMany({
            where: {
                userId,
                missedOn: { gte: weekStart, lte: weekEnd }
            }
        }),

        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: weekStart, lte: weekEnd }
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: {
                userId,
                completedDate: { gte: weekStart, lte: weekEnd }
            }
        })
    ]);

    /* ------------------ MAPS ------------------ */

    const completedMap = new Map();
    scheduleCompletions.forEach(c => {
        const k = dayKey(c.completedOn);
        if (!completedMap.has(k)) completedMap.set(k, new Set());
        completedMap.get(k).add(c.scheduleId);
    });

    const missedMap = new Map();
    missedSchedules.forEach(m => {
        const k = dayKey(m.missedOn);
        if (!missedMap.has(k)) missedMap.set(k, new Set());
        missedMap.get(k).add(m.scheduleId);
    });

    const dailyCompletedMap = new Map();
    dailyCompletions.forEach(c => {
        const k = dayKey(c.completedDate);
        if (!dailyCompletedMap.has(k)) dailyCompletedMap.set(k, new Set());
        dailyCompletedMap.get(k).add(c.taskId);
    });

    /* ------------------ INIT DAYS ------------------ */

    const days = {};
    for (let d = new Date(weekStart); d <= weekEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        days[dayKey(d)] = { total: 0, completed: 0, missed: 0, pending: 0 };
    }

    /* ------------------ SCHEDULED ------------------ */

    for (const s of schedules) {
        for (const key of Object.keys(days)) {
            const d = new Date(`${key}T00:00:00Z`);
            if (!appliesOnDate(s, d)) continue;

            days[key].total++;

            if (completedMap.get(key)?.has(s.id)) days[key].completed++;
            else if (missedMap.get(key)?.has(s.id)) days[key].missed++;
            else days[key].pending++;
        }
    }

    /* ------------------ UNSCHEDULED ------------------ */

    for (const t of unscheduledTasks) {
        const key = dayKey(startOfUTCDate(t.createdAt));
        if (!days[key]) continue;

        days[key].total++;

        if (dailyCompletedMap.get(key)?.has(t.id)) {
            days[key].completed++;
        } else {
            days[key].pending++;
        }
    }

    /* ------------------ SUMMARY ------------------ */

    const summary = Object.values(days).reduce(
        (acc, d) => {
            acc.total += d.total;
            acc.completed += d.completed;
            acc.missed += d.missed;
            acc.pending += d.pending;
            return acc;
        },
        { total: 0, completed: 0, missed: 0, pending: 0 }
    );

    summary.completionRate = summary.total
        ? Math.round((summary.completed / summary.total) * 100)
        : 0;

    return {
        weekStart: dayKey(weekStart),
        weekEnd: dayKey(weekEnd),
        summary,
        days
    };
};

export const getMonthlyDashboard = async (userId, year, month) => {
    const { monthStart, monthEnd } = getMonthRange(year, month);

    /* ------------------ FETCH ONCE ------------------ */

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyCompletions
    ] = await Promise.all([
        prisma.schedule.findMany({
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
            }
        }),

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
        }),

        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: monthStart, lte: monthEnd }
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: {
                userId,
                completedDate: { gte: monthStart, lte: monthEnd }
            }
        })
    ]);

    /* ------------------ MAPS ------------------ */

    const completedMap = new Map();
    scheduleCompletions.forEach(c => {
        const k = dayKey(c.completedOn);
        if (!completedMap.has(k)) completedMap.set(k, new Set());
        completedMap.get(k).add(c.scheduleId);
    });

    const missedMap = new Map();
    missedSchedules.forEach(m => {
        const k = dayKey(m.missedOn);
        if (!missedMap.has(k)) missedMap.set(k, new Set());
        missedMap.get(k).add(m.scheduleId);
    });

    const dailyCompletedMap = new Map();
    dailyCompletions.forEach(c => {
        const k = dayKey(c.completedDate);
        if (!dailyCompletedMap.has(k)) dailyCompletedMap.set(k, new Set());
        dailyCompletedMap.get(k).add(c.taskId);
    });

    /* ------------------ INIT DAYS ------------------ */

    const days = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        days[dayKey(d)] = { total: 0, completed: 0, missed: 0, pending: 0 };
    }

    /* ------------------ SCHEDULED ------------------ */

    for (const s of schedules) {
        for (const key of Object.keys(days)) {
            const d = new Date(`${key}T00:00:00Z`);
            if (!appliesOnDate(s, d)) continue;

            days[key].total++;

            if (completedMap.get(key)?.has(s.id)) days[key].completed++;
            else if (missedMap.get(key)?.has(s.id)) days[key].missed++;
            else days[key].pending++;
        }
    }

    /* ------------------ UNSCHEDULED ------------------ */

    for (const t of unscheduledTasks) {
        const key = dayKey(startOfUTCDate(t.createdAt));
        if (!days[key]) continue;

        days[key].total++;

        if (dailyCompletedMap.get(key)?.has(t.id)) {
            days[key].completed++;
        } else {
            days[key].pending++;
        }
    }

    /* ------------------ SUMMARY ------------------ */

    const summary = Object.values(days).reduce(
        (acc, d) => {
            acc.total += d.total;
            acc.completed += d.completed;
            acc.missed += d.missed;
            acc.pending += d.pending;
            return acc;
        },
        { total: 0, completed: 0, missed: 0, pending: 0 }
    );

    summary.completionRate = summary.total
        ? Math.round((summary.completed / summary.total) * 100)
        : 0;

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        summary,
        days
    };
};

// Helpers
const startOfUTCDate = (d = new Date()) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const dayKey = (d) => d.toISOString().slice(0, 10);

const getWeekRange = (date) => {
    const d = startOfUTCDate(date);
    const day = d.getUTCDay(); // 0=Sun
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

const appliesOnDate = (schedule, date) => {
    const sDate = startOfUTCDate(schedule.scheduleDate);
    const cDate = startOfUTCDate(date);

    if (cDate < sDate) return false;
    if (schedule.repeatUntil && cDate > startOfUTCDate(schedule.repeatUntil)) return false;

    switch (schedule.recurrence) {
        case "NONE":
            return sDate.getTime() === cDate.getTime();
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


// STRICT streak engine
export const buildPerfectDayMap = async (userId, startDate, endDate) => {
    const start = startOfUTCDate(startDate);

    const end = new Date(startOfUTCDate(endDate));
    end.setUTCHours(23, 59, 59, 999); // FULL DAY END

    /* ---------------- FETCH DATA ONCE ---------------- */

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyCompletions
    ] = await Promise.all([

        // Scheduled tasks (including recurring)
        prisma.schedule.findMany({
            where: {
                userId,
                scheduleDate: { lte: end },
                OR: [
                    { repeatUntil: null },
                    { repeatUntil: { gte: start } }
                ]
            }
        }),

        prisma.scheduleCompletion.findMany({
            where: {
                userId,
                completedOn: { gte: start, lte: end }
            }
        }),

        prisma.missedSchedule.findMany({
            where: {
                userId,
                missedOn: { gte: start, lte: end }
            }
        }),

        // Unscheduled tasks (created in range)
        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: start, lte: end }
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: {
                userId,
                completedDate: { gte: start, lte: end }
            }
        })
    ]);

    /* ---------------- INDEX MAPS ---------------- */

    const completedScheduleMap = new Map();
    scheduleCompletions.forEach(c => {
        const k = dayKey(c.completedOn);
        if (!completedScheduleMap.has(k)) completedScheduleMap.set(k, new Set());
        completedScheduleMap.get(k).add(c.scheduleId);
    });

    const missedScheduleMap = new Map();
    missedSchedules.forEach(m => {
        const k = dayKey(m.missedOn);
        if (!missedScheduleMap.has(k)) missedScheduleMap.set(k, new Set());
        missedScheduleMap.get(k).add(m.scheduleId);
    });

    const completedTaskMap = new Map();
    dailyCompletions.forEach(c => {
        const k = dayKey(c.completedDate);
        if (!completedTaskMap.has(k)) completedTaskMap.set(k, new Set());
        completedTaskMap.get(k).add(c.taskId);
    });

    /* ---------------- STRICT PERFECT DAY LOGIC ---------------- */

    const perfectMap = {};

    for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
    ) {
        const key = dayKey(d);

        const applicableSchedules = schedules.filter(s =>
            appliesOnDate(s, d)
        );

        const unscheduledForDay = unscheduledTasks.filter(
            t => dayKey(startOfUTCDate(t.createdAt)) === key
        );

        // No work at all → NOT a streak day
        if (
            applicableSchedules.length === 0 &&
            unscheduledForDay.length === 0
        ) {
            perfectMap[key] = false;
            continue;
        }

        // Any missed schedule kills the streak
        const missedCount = missedScheduleMap.get(key)?.size ?? 0;
        if (missedCount > 0) {
            perfectMap[key] = false;
            continue;
        }

        // Scheduled tasks must ALL be completed
        if (applicableSchedules.length > 0) {
            const completed = completedScheduleMap.get(key)?.size ?? 0;
            if (completed !== applicableSchedules.length) {
                perfectMap[key] = false;
                continue;
            }
        }

        // Unscheduled tasks must ALL be completed
        if (unscheduledForDay.length > 0) {
            const completed = completedTaskMap.get(key)?.size ?? 0;
            if (completed !== unscheduledForDay.length) {
                perfectMap[key] = false;
                continue;
            }
        }

        // STRICT PERFECT DAY
        perfectMap[key] = true;
    }

    return perfectMap;
};


// Current Streak
export const getStreakOverview = async (userId) => {
    const today = startOfUTCDate();
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - 364);

    const map = await buildPerfectDayMap(userId, start, today);
    const keys = Object.keys(map).sort();

    let current = 0;
    for (let i = keys.length - 1; i >= 0; i--) {
        if (!map[keys[i]]) break;
        current++;
    }

    let longest = 0;
    let run = 0;
    for (const k of keys) {
        if (map[k]) {
            run++;
            longest = Math.max(longest, run);
        } else {
            run = 0;
        }
    }

    return {
        currentStreak: current,
        longestStreak: longest,
        isActive: current > 0
    };
};

// Streak Calender
export const getStreakCalendar = async (userId, days = 90) => {
    const today = startOfUTCDate();
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - (days - 1));

    return await buildPerfectDayMap(userId, start, today);
};


// Performance engine
export const buildDailyStatsMap = async (userId, startDate, endDate) => {
    const start = startOfUTCDate(startDate);
    const end = new Date(startOfUTCDate(endDate));
    end.setUTCHours(23, 59, 59, 999); // FULL DAY RANGE

    const [
        schedules,
        scheduleCompletions,
        missedSchedules,
        unscheduledTasks,
        dailyCompletions
    ] = await Promise.all([

        /* ---------- Scheduled ---------- */
        prisma.schedule.findMany({
            where: {
                userId,
                scheduleDate: { lte: end },
                OR: [
                    { repeatUntil: null },
                    { repeatUntil: { gte: start } }
                ]
            }
        }),

        prisma.scheduleCompletion.findMany({
            where: {
                userId,
                completedOn: { gte: start, lte: end }
            }
        }),

        prisma.missedSchedule.findMany({
            where: {
                userId,
                missedOn: { gte: start, lte: end }
            }
        }),

        /* ---------- Unscheduled (FIXED) ---------- */
        prisma.task.findMany({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {} },
                createdAt: { gte: start, lte: end } // STRICT RANGE
            }
        }),

        prisma.taskDailyCompletion.findMany({
            where: {
                userId,
                completedDate: { gte: start, lte: end }
            }
        })
    ]);

    /* ---------- Index maps ---------- */

    const completedScheduleMap = new Map();
    scheduleCompletions.forEach(c => {
        const k = dayKey(c.completedOn);
        if (!completedScheduleMap.has(k)) completedScheduleMap.set(k, new Set());
        completedScheduleMap.get(k).add(c.scheduleId);
    });

    const missedScheduleMap = new Map();
    missedSchedules.forEach(m => {
        const k = dayKey(m.missedOn);
        if (!missedScheduleMap.has(k)) missedScheduleMap.set(k, new Set());
        missedScheduleMap.get(k).add(m.scheduleId);
    });

    const completedTaskMap = new Map();
    dailyCompletions.forEach(c => {
        const k = dayKey(c.completedDate);
        if (!completedTaskMap.has(k)) completedTaskMap.set(k, new Set());
        completedTaskMap.get(k).add(c.taskId);
    });

    /* ---------- Stats ---------- */

    const statsMap = {};

    for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
    ) {
        const key = dayKey(d);

        const applicableSchedules = schedules.filter(s =>
            appliesOnDate(s, d)
        );

        const unscheduledForDay = unscheduledTasks.filter(
            t => dayKey(startOfUTCDate(t.createdAt)) === key
        );

        const scheduledTotal = applicableSchedules.length;
        const unscheduledTotal = unscheduledForDay.length;

        const completedScheduled =
            completedScheduleMap.get(key)?.size ?? 0;

        const completedUnscheduled =
            completedTaskMap.get(key)?.size ?? 0;

        const missed =
            missedScheduleMap.get(key)?.size ?? 0;

        const total = scheduledTotal + unscheduledTotal;
        const completed = Math.min(
            completedScheduled + completedUnscheduled,
            total
        );

        statsMap[key] = {
            total,
            completed,
            missed,
            score: total === 0
                ? 0
                : Math.round((completed / total) * 100)
        };
    }

    return statsMap;
};

// Daily
export const getDailyPerformance = async (userId, date = new Date()) => {
    const day = startOfUTCDate(date);
    const key = dayKey(day);

    const map = await buildDailyStatsMap(userId, day, day);
    return { date: key, ...map[key] };
};

// Weekly
export const getWeeklyPerformance = async (userId, date = new Date()) => {
    const { weekStart, weekEnd } = getWeekRange(date);
    const map = await buildDailyStatsMap(userId, weekStart, weekEnd);

    let total = 0, completed = 0;
    Object.values(map).forEach(v => {
        total += v.total;
        completed += v.completed;
    });

    return {
        weekStart: dayKey(weekStart),
        weekEnd: dayKey(weekEnd),
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
        breakdown: map
    };
};

// Monthly
export const getMonthlyPerformance = async (userId, year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const today = startOfUTCDate();
    const effectiveEnd = end > today ? today : end;

    const map = await buildDailyStatsMap(userId, start, effectiveEnd);

    let total = 0, completed = 0;
    Object.values(map).forEach(v => {
        total += v.total;
        completed += v.completed;
    });

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
        breakdown: map
    };
};

