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