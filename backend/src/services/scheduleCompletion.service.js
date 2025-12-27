import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const completeSchedule = async (scheduleId, userId) => {
    return prisma.$transaction(async (tx) => {
        const schedule = await tx.schedule.findFirst({
            where: { id: scheduleId, userId }
        });

        if (!schedule) {
            throw new ApiError(404, "Schedule not found");
        }

        const existing = await tx.taskCompletion.findUnique({
            where: { scheduleId }
        });

        if (existing) {
            throw new ApiError(409, "Schedule already completed");
        }

        const completion = await tx.taskCompletion.create({
            data: { scheduleId, userId }
        });

        // IMPORTANT: remove missed record if exists
        await tx.missedSchedule.deleteMany({
            where: { scheduleId }
        });

        return completion;
    });
};

export const undoCompleteSchedule = async (scheduleId, userId) => {
    const completion = await prisma.taskCompletion.findFirst({
        where: { scheduleId, userId }
    });

    if (!completion) {
        throw new ApiError(404, "Schedule is not completed");
    }

    await prisma.taskCompletion.delete({
        where: { id: completion.id }
    });
};

export const completeBulk = async (scheduleIds, userId) => {
    const schedules = await prisma.schedule.findMany({
        where: { id: { in: scheduleIds }, userId },
        select: { id: true }
    });

    if (!schedules.length) {
        throw new ApiError(404, "No valid schedules found");
    }

    const validIds = schedules.map(s => s.id);

    const existing = await prisma.taskCompletion.findMany({
        where: { scheduleId: { in: validIds } },
        select: { scheduleId: true }
    });

    const completedSet = new Set(existing.map(c => c.scheduleId));

    const toCreate = validIds
        .filter(id => !completedSet.has(id))
        .map(id => ({ scheduleId: id, userId }));

    if (toCreate.length) {
        await prisma.taskCompletion.createMany({
            data: toCreate,
            skipDuplicates: true
        });

        // cleanup missed
        await prisma.missedSchedule.deleteMany({
            where: { scheduleId: { in: toCreate.map(t => t.scheduleId) } }
        });
    }

    return {
        requested: scheduleIds.length,
        completed: toCreate.length,
        skipped: completedSet.size
    };
};

export const getCompletionHistory = async (userId) => {
    const completed = await prisma.taskCompletion.findMany({
        where: { userId },
        include: { schedule: { include: { task: true } } }
    });

    const missed = await prisma.missedSchedule.findMany({
        where: { userId },
        include: { schedule: { include: { task: true } } }
    });

    return {
        completed: completed.map(c => ({
            scheduleId: c.scheduleId,
            taskTitle: c.schedule.task.title,
            completedAt: c.completedAt,
            status: "COMPLETED"
        })),
        missed: missed.map(m => ({
            scheduleId: m.scheduleId,
            taskTitle: m.schedule.task.title,
            missedAt: m.missedAt,
            status: "MISSED"
        }))
    };
};
