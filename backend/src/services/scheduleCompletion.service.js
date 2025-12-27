import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

/**
 * Normalize date to UTC start-of-day
 */
const normalizeDate = (date) => {
    const d = date ? new Date(date) : new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

/**
 * Complete a single schedule (for a specific day)
 */
export const completeSchedule = async (scheduleId, userId, date) => {
    const completedOn = normalizeDate(date);

    return prisma.$transaction(async (tx) => {
        // 1️⃣ Validate schedule ownership
        const schedule = await tx.schedule.findFirst({
            where: { id: scheduleId, userId }
        });

        if (!schedule) {
            throw new ApiError(404, "Schedule not found");
        }

        // 2️⃣ Prevent double completion (per day)
        const existing = await tx.scheduleCompletion.findUnique({
            where: {
                scheduleId_completedOn: {
                    scheduleId,
                    completedOn
                }
            }
        });

        if (existing) {
            throw new ApiError(409, "Schedule already completed for this date");
        }

        // 3️⃣ Create completion
        const completion = await tx.scheduleCompletion.create({
            data: {
                scheduleId,
                userId,
                completedOn
            }
        });

        // 4️⃣ Remove missed entry (same day)
        await tx.missedSchedule.deleteMany({
            where: {
                scheduleId,
                missedOn: completedOn
            }
        });

        return completion;
    });
};

/**
 * Undo schedule completion (for a specific day)
 */
export const undoCompleteSchedule = async (scheduleId, userId, date) => {
    const completedOn = normalizeDate(date);

    const completion = await prisma.scheduleCompletion.findUnique({
        where: {
            scheduleId_completedOn: {
                scheduleId,
                completedOn
            }
        }
    });

    if (!completion || completion.userId !== userId) {
        throw new ApiError(404, "Schedule completion not found");
    }

    await prisma.scheduleCompletion.delete({
        where: { id: completion.id }
    });
};

/**
 * Bulk complete schedules (for same day)
 */
export const completeBulk = async (scheduleIds, userId, date) => {
    if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        throw new ApiError(400, "scheduleIds must be a non-empty array");
    }

    const completedOn = normalizeDate(date);

    // 1️⃣ Validate schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            id: { in: scheduleIds },
            userId
        },
        select: { id: true }
    });

    if (!schedules.length) {
        throw new ApiError(404, "No valid schedules found");
    }

    const validIds = schedules.map(s => s.id);

    // 2️⃣ Find existing completions (same day)
    const existing = await prisma.scheduleCompletion.findMany({
        where: {
            scheduleId: { in: validIds },
            completedOn
        },
        select: { scheduleId: true }
    });

    const completedSet = new Set(existing.map(c => c.scheduleId));

    const toCreate = validIds
        .filter(id => !completedSet.has(id))
        .map(id => ({
            scheduleId: id,
            userId,
            completedOn
        }));

    // 3️⃣ Insert & cleanup missed
    if (toCreate.length) {
        await prisma.$transaction([
            prisma.scheduleCompletion.createMany({
                data: toCreate,
                skipDuplicates: true
            }),
            prisma.missedSchedule.deleteMany({
                where: {
                    scheduleId: { in: toCreate.map(t => t.scheduleId) },
                    missedOn: completedOn
                }
            })
        ]);
    }

    return {
        requested: scheduleIds.length,
        valid: validIds.length,
        completed: toCreate.length,
        skipped: completedSet.size
    };
};

/**
 * Get completion + missed history
 */
export const getCompletionHistory = async (userId) => {
    const completed = await prisma.scheduleCompletion.findMany({
        where: { userId },
        include: {
            schedule: { include: { task: true } }
        },
        orderBy: { completedAt: "desc" }
    });

    const missed = await prisma.missedSchedule.findMany({
        where: { userId },
        include: {
            schedule: { include: { task: true } }
        },
        orderBy: { missedAt: "desc" }
    });

    return {
        completed: completed.map(c => ({
            scheduleId: c.scheduleId,
            taskId: c.schedule.taskId,
            taskTitle: c.schedule.task.title,
            completedOn: c.completedOn,
            completedAt: c.completedAt,
            status: "COMPLETED"
        })),
        missed: missed.map(m => ({
            scheduleId: m.scheduleId,
            taskId: m.schedule.taskId,
            taskTitle: m.schedule.task.title,
            missedOn: m.missedOn,
            missedAt: m.missedAt,
            status: "MISSED"
        }))
    };
};
