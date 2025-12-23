import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const createTask = async (userId, taskData) => {
    const { title, description, priority, dueDate, categoryId } = taskData;

    // Validate category id if provide
    if (categoryId) {
        const category = await prisma.category.findFirst({
            where:
            {
                id: categoryId,
                userId
            }
        });

        if (!category) {
            throw new ApiError(404, "Category not found");
        }
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            categoryId,
            userId
        }
    });

    return task;

};


export const getTasks = async (userId, query) => {
    const {
        categoryId,
        priority,
        isArchived,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = query;

    const where = {
        userId,
        deletedAt: null,
    }

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (priority) {
        where.priority = priority;
    }

    if (isArchived !== undefined) {
        where.isArchived = isArchived === 'true';
    }

    if (search) {
        where.title = {
            contains: search,
            mode: 'insensitive'
        };
    }

    // pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Fetch data
    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            skip,
            take,
            orderBy: {
                [sortBy]: sortOrder
            },
            include: {
                category: true
            }
        }),
        prisma.task.count({ where })
    ]);

    return {
        tasks,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
}


export const getTask = async (userId, taskId) => {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
            deletedAt: null
        },
        include: {
            category: true,
            schedules: true
        }
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return task;
}

export const updateTask = async (userId, taskId, taskData) => {

    // Find task (owner + soft delete check)
    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId,
        },
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // validate category id if provide
    if (taskData.categoryId) {
        const category = await prisma.category.findFirst({
            where: {
                id: taskData.categoryId,
                userId
            }
        });

        if (!category) {
            throw new ApiError(404, "Category not found");
        }
    }

    const data = {};

    if (taskData.title !== undefined) {
        if (!taskData.title || !taskData.title.trim()) {
            throw new ApiError(400, "Title is required");
        }
        data.title = taskData.title.trim();
    }

    if (taskData.description !== undefined) {
        data.description = taskData.description;
    }

    if (taskData.priority !== undefined) {
        data.priority = taskData.priority;
    }

    if (taskData.dueDate !== undefined) {
        data.dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;
    }

    if (taskData.categoryId !== undefined) {
        data.categoryId = taskData.categoryId;
    }

    if (taskData.order !== undefined) {
        data.order = taskData.order;
    }

    if (taskData.isArchived !== undefined) {
        data.isArchived = taskData.isArchived;
    }

    // update task
    const updateTask = await prisma.task.update({
        where: {
            id: taskId
        },
        data
    });

    return updateTask;
}


export const deleteTask = async (userId, taskId) => {
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

    // soft delete task
    await prisma.task.update({
        where: {
            id: taskId
        },
        data: {
            deletedAt: new Date(),
            isArchived: true
        }
    });

    return;
}
