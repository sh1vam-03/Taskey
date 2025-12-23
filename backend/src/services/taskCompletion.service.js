import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";



export const completeTask = async (userId, taskId, date) => {

    const completedDate = date ? new Date(date) : new Date();
    completedDate.setHours(0, 0, 0, 0);

    const completedAt = new Date();

    // Find task (owner + soft delete check)
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
            deletedAt: null
        },
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // check if task is already completed
    const taskCompletion = await prisma.taskCompletion.findUnique({
        where: {
            taskId_completedDate: {
                taskId,
                completedDate
            }
        }
    });

    if (taskCompletion) {
        throw new ApiError(400, "Task already completed for this date");
    }

    // create task completion
    await prisma.taskCompletion.create({
        data: {
            taskId,
            userId,
            completedDate,
            completedAt
        }
    });

    return;
}

export const undoTaskCompletion = async (userId, taskId, date) => {
    const completedDate = date ? new Date(date) : new Date();
    completedDate.setHours(0, 0, 0, 0);

    // Create end of day for range query
    const endOfDay = new Date(completedDate);
    endOfDay.setHours(23, 59, 59, 999);


    // Find task (owner + soft delete check)
    const completion = await prisma.taskCompletion.findFirst({
        where: {
            taskId,
            userId,
            completedDate: {
                gte: completedDate, // greater than or equal to start of day
                lte: endOfDay,      // less than or equal to end of day
            },

        }
    });

    if (!completion) {
        throw new ApiError(404, "Task completion not found");
    }

    // delete task completion
    await prisma.taskCompletion.delete({
        where: {
            id: completion.id
        }
    });

    return;
}


export const getTaskCompletion = async (userId, taskId) => {

    // Verify task
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
            deletedAt: null
        },
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Fetch task completion history
    const completion = await prisma.taskCompletion.findMany({
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

    if (!completion) {
        throw new ApiError(404, "Task completion history not found");
    }

    return completion;
}


export const completeBulkTasks = async (userId, taskIds, date) => {

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new ApiError(400, "Invalid taskIds");
    }

    const completedDate = date ? new Date(date) : new Date();
    completedDate.setHours(0, 0, 0, 0);

    const completedAt = new Date();

    // Verify tasks
    const tasks = await prisma.task.findMany({
        where: {
            id: {
                in: taskIds
            },
            userId,
            deletedAt: null
        },
        select: {
            id: true
        }
    });

    if (tasks.length === 0) {
        throw new ApiError(404, "No valid tasks found");
    }

    const validTaskIds = tasks.map(task => task.id);

    // check if tasks are already completed
    const taskCompletions = await prisma.taskCompletion.findMany({
        where: {
            taskId: {
                in: validTaskIds
            },
            completedDate
        },
        select: {
            taskId: true
        }
    });

    const alreadyCompletedTaskIds = new Set(taskCompletions.map(completion => completion.taskId));

    // Prepare bulk insert data
    const newCompletions = validTaskIds
        .filter(taskId => !alreadyCompletedTaskIds.has(taskId))
        .map(taskId => ({
            taskId,
            userId,
            completedDate,
            completedAt
        }));

    // Insert in bulk
    if (newCompletions.length > 0) {
        await prisma.taskCompletion.createMany({
            data: newCompletions,
            skipDuplicates: true
        });
    }

    return {
        requested: taskIds.length,
        valid: validTaskIds.length,
        completed: newCompletions.length,
        skipped: alreadyCompletedTaskIds.size
    };
}