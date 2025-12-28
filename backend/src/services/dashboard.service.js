import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";


export const getDashboardOverview = async (userId) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [

        // SCHEDULED
        scheduledToady,
        completedSchedules,
        missedSchedules,

        // UNSCHEDULED
        unscheduledTasks,
        completedDailyTasks,

    ] = await Promise.all([

        prisma.schedule.count({
            where: {
                userId,
                OR: [{
                    recurrence: "NONE",
                    scheduleDate: today,
                }, {
                    recurrence: { not: "NONE" },
                    scheduleDate: { lte: today },
                    repeatUntil: { gte: today },
                }],
            }
        }),

        prisma.scheduleCompletion.count({
            where: {
                userId,
                completedOn: today,
            }
        }),

        prisma.missedSchedule.count({
            where: {
                userId,
                missedOn: today,
            }
        }),

        prisma.task.count({
            where: {
                userId,
                deletedAt: null,
                schedules: { none: {}, },
                createdAt: { gte: today, lt: tomorrow },
            }
        }),

        prisma.taskDailyCompletion.count({
            where: {
                userId,
                completedDate: today,
            }
        }),

    ])

    const totalTasks = scheduledToady + unscheduledTasks;
    const completedTasks = completedSchedules + completedDailyTasks;
    const missedTasks = missedSchedules;

    return {
        today: {
            totalTasks,
            completedTasks,
            missedTasks,
            pendingTasks: Math.max(totalTasks - completedTasks - missedTasks, 0)
        }
    }

}

const todayUTC = () => {
    const d = new Date();
    return new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate()
    ));
}

const formatTime = (time) =>
    time ? time.toISOString().slice(11, 16) : null;

export const getTodayDashboard = async (userId) => {
    const today = todayUTC();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // Scheduled tasks
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [{
                recurrence: "NONE",
                scheduleDate: today,
            }, {
                recurrence: { not: "NONE" },
                scheduleDate: { lte: today },
                repeatUntil: { gte: today },
            }],
        },
        include: {
            task: true,
        },
        orderBy: {
            startTime: "asc",
        }
    })

    const [completedSchedules, missedSchedules] = await Promise.all([
        prisma.scheduleCompletion.findMany({
            where: {
                userId,
                completedOn: today,
            }
        }),
        prisma.missedSchedule.findMany({
            where: {
                userId,
                missedOn: today,
            }
        }),
    ])

    const completedSchedulesSet = new Set(completedSchedules.map(c => c.scheduleId));
    const missedSchedulesSet = new Set(missedSchedules.map(m => m.scheduleId));

    // Unscheduled tasks
    const unscheduledTasks = await prisma.task.findMany({
        where: {
            userId,
            deletedAt: null,
            schedules: { none: {}, },
            createdAt: { gte: today, lt: tomorrow },
        }
    });

    const dailyCompletions = await prisma.taskDailyCompletion.findMany({
        where: {
            userId,
            completedDate: today,
        }
    });

    const dailyCompledSet = new Set(dailyCompletions.map(c => c.taskId));

    // Build Time Line
    const timeline = [];

    for (const s of schedules) {
        let status = "PENDING";
        if (completedSchedulesSet.has(s.id)) status = "COMPLETED";
        if (missedSchedulesSet.has(s.id)) status = "MISSED";

        timeline.push({
            type: "SCHEDULED",
            scheduleId: s.id,
            taskId: s.taskId,
            title: s.task.title,
            time: `${formatTime(s.startTime)} - ${formatTime(s.endTime)}`,
            status,
        })
    }

    // Unscheduled tasks
    for (const t of unscheduledTasks) {
        let status = dailyCompledSet.has(t.id) ? "COMPLETED" : "PENDING";

        timeline.push({
            type: "UNSCHEDULED",
            taskId: t.id,
            title: t.title,
            time: `${formatTime(t.startTime)} - ${formatTime(t.endTime)}`,
            status,
        })
    }

    const stats = {
        total: timeline.length,
        completed: timeline.filter(t => t.status === "COMPLETED").length,
        missed: timeline.filter(t => t.status === "MISSED").length,
        pending: timeline.filter(t => t.status === "PENDING").length,
    }

    return {
        date: today.toISOString().slice(0, 10),
        stats,
        timeline,
    };
}