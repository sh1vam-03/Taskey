import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { buildDailyStatsMap } from "./dashboard.service.js";

/* -------------------------------------------------------------------------- */
/*                               DATE UTILS                                   */
/* -------------------------------------------------------------------------- */

export const toUTCDate = (input) => {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return null;

    return new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate()
    ));
};

/* -------------------------------------------------------------------------- */
/*                       PRODUCTIVITY SCORE (DERIVED)                          */
/* -------------------------------------------------------------------------- */

const clamp = (v, min = 0, max = 100) =>
    Math.max(min, Math.min(max, v));

export const calculateProductivityScore = ({
    total,
    completed,
    missed,
    sleepHours,
    exercise
}) => {
    if (!total || total === 0) return 0;

    let score = (completed / total) * 100;

    // strong signal
    score -= missed * 5;

    // mild lifestyle modifiers
    if (sleepHours != null && sleepHours < 5) score -= 5;
    if (exercise === true) score += 3;

    return clamp(Math.round(score));
};

/* -------------------------------------------------------------------------- */
/*                           UPSERT (NO SCORE)                                 */
/* -------------------------------------------------------------------------- */

export const upsertBehaviorLog = async (userId, payload) => {
    if (!userId) throw new ApiError(401, "Unauthorized");

    const { date, mood, notes, sleepHours, exercise } = payload;

    if (!mood) throw new ApiError(400, "Mood is required");

    const day = toUTCDate(date ?? new Date());
    if (!day) throw new ApiError(400, "Invalid date");

    const today = toUTCDate(new Date());
    if (day > today) {
        throw new ApiError(400, "Future dates are not allowed");
    }

    return prisma.behaviorLog.upsert({
        where: {
            userId_date: { userId, date: day }
        },
        update: {
            mood,
            notes,
            sleepHours,
            exercise
        },
        create: {
            userId,
            date: day,
            mood,
            notes,
            sleepHours,
            exercise,
            productivityScore: 0 // placeholder, not trusted
        }
    });
};

/* -------------------------------------------------------------------------- */
/*                         GET BEHAVIOR BY DATE                                */
/* -------------------------------------------------------------------------- */

export const getBehaviorLogByDate = async (userId, date) => {
    if (!userId) throw new ApiError(401, "Unauthorized");

    const day = toUTCDate(date);
    if (!day) throw new ApiError(400, "Invalid date");

    const behavior = await prisma.behaviorLog.findUnique({
        where: {
            userId_date: { userId, date: day }
        }
    });

    if (!behavior) return null;

    const statsMap = await buildDailyStatsMap(userId, day, day);
    const key = day.toISOString().slice(0, 10);

    const stats = statsMap[key] ?? {
        total: 0,
        completed: 0,
        missed: 0
    };

    return {
        ...behavior,
        productivityScore: calculateProductivityScore({
            ...stats,
            sleepHours: behavior.sleepHours,
            exercise: behavior.exercise
        })
    };
};

/* -------------------------------------------------------------------------- */
/*                           BEHAVIOR SUMMARY                                  */
/* -------------------------------------------------------------------------- */

export const getBehaviorSummary = async (userId, days = 7) => {
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (days < 1 || days > 90) {
        throw new ApiError(400, "Days must be between 1 and 90");
    }

    const end = toUTCDate(new Date());
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - (days - 1));

    const logs = await prisma.behaviorLog.findMany({
        where: {
            userId,
            date: { gte: start, lte: end }
        },
        orderBy: { date: "asc" }
    });

    if (!logs.length) {
        return {
            avgProductivity: 0,
            moodDistribution: {},
            daysLogged: 0
        };
    }

    let totalScore = 0;
    const moodDistribution = {};

    for (const log of logs) {
        const statsMap = await buildDailyStatsMap(userId, log.date, log.date);
        const key = log.date.toISOString().slice(0, 10);

        const stats = statsMap[key] ?? {
            total: 0,
            completed: 0,
            missed: 0
        };

        const score = calculateProductivityScore({
            ...stats,
            sleepHours: log.sleepHours,
            exercise: log.exercise
        });

        totalScore += score;
        moodDistribution[log.mood] =
            (moodDistribution[log.mood] || 0) + 1;
    }

    return {
        avgProductivity: Math.round(totalScore / logs.length),
        moodDistribution,
        daysLogged: logs.length
    };
};

/**
 * Explain why a productivity score was high or low
 * Single-source-of-truth, deterministic & debuggable
 */
export const explainProductivityScore = async (userId, date) => {
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const day = toUTCDate(date ?? new Date());
    if (!day) {
        throw new ApiError(400, "Invalid date");
    }

    const key = day.toISOString().slice(0, 10);

    const [behavior, statsMap] = await Promise.all([
        getBehaviorLogByDate(userId, day),
        buildDailyStatsMap(userId, day, day)
    ]);

    const stats = statsMap[key] ?? {
        total: 0,
        completed: 0,
        missed: 0
    };


    if (!behavior) {
        return {
            date: key,
            finalScore: 0,
            explanation: "No behavior log found for this day",
            breakdown: null,
            penalties: [],
            bonuses: [],
            tips: ["Log your daily behavior to track productivity"]
        };
    }


    const pointsPerTask =
        stats.total > 0 ? 100 / stats.total : 0;

    const baseScore =
        stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;


    const penalties = [];

    if (stats.missed > 0) {
        penalties.push({
            type: "MISSED_TASK",
            impact: stats.missed * -5,
            message: `Missed ${stats.missed} scheduled task${stats.missed > 1 ? "s" : ""}`
        });
    }

    if (
        behavior.sleepHours != null &&
        behavior.sleepHours < 5
    ) {
        penalties.push({
            type: "LOW_SLEEP",
            impact: -5,
            message: "Sleep was less than 5 hours"
        });
    }

    const bonuses = [];

    if (behavior.exercise === true) {
        bonuses.push({
            type: "EXERCISE",
            impact: +3,
            message: "Exercise improved focus and energy"
        });
    }


    const finalScore = calculateProductivityScore({
        ...stats,
        sleepHours: behavior.sleepHours,
        exercise: behavior.exercise
    });


    const tips = [];

    if (stats.completed < stats.total) {
        tips.push("Completing all tasks increases your base score");
    }

    if (behavior.sleepHours != null && behavior.sleepHours < 6) {
        tips.push("Try getting at least 6 hours of sleep");
    }

    if (!behavior.exercise) {
        tips.push("Light exercise can slightly boost productivity");
    }


    return {
        date: key,

        baseScore,

        breakdown: {
            totalTasks: stats.total,
            completedTasks: stats.completed,
            pointsPerTask: Number(pointsPerTask.toFixed(2))
        },

        penalties,
        bonuses,

        finalScore,
        tips
    };
};
