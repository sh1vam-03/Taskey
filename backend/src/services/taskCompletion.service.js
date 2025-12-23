import { prisma } from "../config/prisma.js";
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

    // Find task (owner + soft delete check)
    const completion = await prisma.taskCompletion.findFirst({
        where: {
            taskId,
            userId,
            completedDate
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
