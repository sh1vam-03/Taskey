import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";


function normalizeUTCDate(date) {
    const d = date ? new Date(date) : new Date();
    return new Date(Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate()
    ));
}


/**
 * Complete a task for a specific day (NO schedule)
 */
export const completeTask = async (userId, taskId, date) => {
    const completedDate = normalizeUTCDate(date);

    // 1️⃣ Verify task ownership & not deleted
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
            deletedAt: null
        }
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // 2️⃣ Prevent duplicate completion
    const existing = await prisma.taskDailyCompletion.findUnique({
        where: {
            taskId_completedDate: {
                taskId,
                completedDate
            }
        }
    });

    if (existing) {
        throw new ApiError(409, "Task already completed for this date");
    }

    // 3️⃣ Create completion
    return prisma.taskDailyCompletion.create({
        data: {
            taskId,
            userId,
            completedDate
        }
    });
};

/**
 * Undo task completion for a specific day
 */
export const undoTaskCompletion = async (userId, taskId, date) => {
    const completedDate = normalizeUTCDate(date);

    const completion = await prisma.taskDailyCompletion.findUnique({
        where: {
            taskId_completedDate: {
                taskId,
                completedDate
            }
        }
    });

    if (!completion) {
        throw new ApiError(404, "Task completion not found");
    }

    if (completion.userId !== userId) {
        throw new ApiError(403, "Unauthorized");
    }

    await prisma.taskDailyCompletion.delete({
        where: { id: completion.id }
    });
};

/**
 * Get task daily completion history
 */
export const getTaskCompletionHistory = async (userId, taskId) => {
    // Verify task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
            deletedAt: null
        }
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return prisma.taskDailyCompletion.findMany({
        where: {
            taskId,
            userId
        },
        orderBy: {
            completedDate: "desc"
        },
        select: {
            completedDate: true,
            completedAt: true
        }
    });
};

/**
 * Bulk complete tasks for a specific day
 */
export const completeBulkTasks = async (userId, taskIds, date) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new ApiError(400, "taskIds must be a non-empty array");
    }

    const completedDate = normalizeUTCDate(date);

    // 1️⃣ Verify tasks
    const tasks = await prisma.task.findMany({
        where: {
            id: { in: taskIds },
            userId,
            deletedAt: null
        },
        select: { id: true }
    });

    if (!tasks.length) {
        throw new ApiError(404, "No valid tasks found");
    }

    const validTaskIds = tasks.map(t => t.id);

    // 2️⃣ Find already completed
    const existing = await prisma.taskDailyCompletion.findMany({
        where: {
            taskId: { in: validTaskIds },
            completedDate
        },
        select: { taskId: true }
    });

    const completedSet = new Set(existing.map(e => e.taskId));

    // 3️⃣ Prepare inserts
    const toCreate = validTaskIds
        .filter(id => !completedSet.has(id))
        .map(taskId => ({
            taskId,
            userId,
            completedDate
        }));

    if (toCreate.length) {
        await prisma.taskDailyCompletion.createMany({
            data: toCreate,
            skipDuplicates: true
        });
    }

    return {
        requested: taskIds.length,
        valid: validTaskIds.length,
        completed: toCreate.length,
        skipped: completedSet.size
    };
};
