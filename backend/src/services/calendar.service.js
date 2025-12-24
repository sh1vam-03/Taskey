import prisma from "../config/db.js";




export const getDayCalender = async (dateString, userId) => {
    if (!dateString) {
        const now = new Date();
        dateString = now.toISOString().split("T")[0];
    }

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    // Get schedules for the day
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            scheduleDate: date
        },
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    dueDate: true,
                    categoryId: true
                }
            }
        },
        orderBy: [
            { startTime: "asc" }
        ]
    });


    // get completions for the day
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: date
        },
        select: {
            taskId: true,
            completedAt: true
        }
    });


    const completedTasksMap = new Map();
    completions.forEach((completion) => {
        completedTasksMap.set(completion.taskId, completion.completedAt);
    });

    const scheduledTasks = [];
    const completedTasks = [];
    const pendingTasks = [];
    const missedTasks = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Classify schedules
    for (const schedule of schedules) {
        const isCompleted = completedTasksMap.has(schedule.taskId);

        const taskData = {
            scheduleId: schedule.id,
            taskId: schedule.task.id,
            title: schedule.task.title,
            priority: schedule.task.priority,
            startTime: schedule.task.startTime,
            endTime: schedule.task.endTime,
            completedAt: completedTasksMap.get(schedule.taskId) || null
        };

        scheduledTasks.push(taskData);

        if (isCompleted) {
            completedTasks.push(taskData);
        } else if (date < today) {
            missedTasks.push(taskData);
        } else {
            pendingTasks.push(taskData);
        }
    }

    return {
        date: dateString,
        scheduledTasks,
        completedTasks,
        pendingTasks,
        missedTasks
    }

}

export const getWeekCalender = async (dateString, userId) => {
    if (!dateString) {
        const now = new Date();
        dateString = now.toISOString().split("T")[0];
    }

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    const { weekStart, weekEnd } = getWeekRange(date);

    // Get schedules for the week
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            scheduleDate: {
                gte: weekStart,
                lte: weekEnd
            }
        },
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    dueDate: true,
                    priority: true,
                }
            }
        },
        orderBy: [
            { scheduleDate: "asc" },
            { startTime: "asc" }
        ]
    });


    // Fetch completions for the week 
    const completion = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: {
                gte: weekStart,
                lte: weekEnd
            }
        }
    });

    // Prepare map 

    const completionMap = new Map();
    completion.forEach(c => {
        const key = c.completedDate.toISOString().slice(0, 10);
        if (!completionMap.has(key)) completionMap.set(key, new Set());
        completionMap.get(key).add(c.taskId);
    });


    // Initialize days

    const days = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const key = d.toISOString().slice(0, 10);

        days[key] = {
            date: key,
            scheduledTasks: [],
            completedTasks: [],
            pendingTasks: [],
            missedTasks: []
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);


    // Classify schedules
    for (const schedule of schedules) {
        const dayKey = schedule.scheduleDate.toLocaleDateString("en-CA");
        const isCompleted = completionMap.get(dayKey)?.has(schedule.taskId) ?? false;

        const taskData = {
            scheduleId: schedule.id,
            taskId: schedule.task.id,
            title: schedule.task.title,
            priority: schedule.task.priority,
            startTime: schedule.task.startTime,
            endTime: schedule.task.endTime,
            completedAt: isCompleted ? schedule.completedAt : null
        };

        days[dayKey].scheduledTasks.push(taskData);

        if (isCompleted) {
            days[dayKey].completedTasks.push(taskData);
        } else if (schedule.scheduleDate < today) {
            days[dayKey].missedTasks.push(taskData);
        } else {
            days[dayKey].pendingTasks.push(taskData);
        }
    }

    return {
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        days
    }
}

// Helper for getWeekCalender
const getWeekRange = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() + diffToMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return {
        weekStart,
        weekEnd
    }
}

export const getMonthCalender = async (year, month, userId) => {
    if (!year || !month) {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
    }

    const { monthStart, monthEnd } = getMonthRange(year, month);

    // Fetch schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            scheduleDate: {
                gte: monthStart,
                lte: monthEnd
            }
        },
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    dueDate: true,
                    priority: true,

                }
            }
        },
        orderBy: [
            { scheduleDate: "asc" },
            { startTime: "asc" }
        ]
    });

    // fetch completions   
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: {
                gte: monthStart,
                lte: monthEnd
            }
        }
    });

    // Completion Map
    const completionMap = new Map();
    completions.forEach(c => {
        const key = c.completedDate.toISOString().slice(0, 10);
        if (!completionMap.has(key)) completionMap.set(key, new Set());
        completionMap.get(key).add(c.taskId);
    });

    // Initialize days
    const days = {};
    const totalDays = new Date(year, month, 0).getDate();
    for (let d = 0; d < totalDays; d++) {
        const date = new Date(year, month - 1, d);
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;

        days[key] = {
            scheduledTasks: [],
            completedTasks: [],
            pendingTasks: [],
            missedTasks: []
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Classify Schedules
    for (const schedule of schedules) {
        const dayKey = schedule.scheduleDate.toLocaleDateString("en-CA");
        const isCompleted = completionMap.get(dayKey)?.has(schedule.taskId) ?? false;

        const taskData = {
            scheduleId: schedule.id,
            taskId: schedule.task.id,
            title: schedule.task.title,
            priority: schedule.task.priority,
            startTime: schedule.task.startTime,
            endTime: schedule.task.endTime,
            completedAt: isCompleted ? schedule.completedAt : null
        };

        days[dayKey].scheduledTasks.push(taskData);

        if (isCompleted) {
            days[dayKey].completedTasks.push(taskData);
        } else if (schedule.scheduleDate < today) {
            days[dayKey].missedTasks.push(taskData);
        } else {
            days[dayKey].pendingTasks.push(taskData);
        }
    }

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
}

// Helper for getMonthCalender
const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    return {
        monthStart: start,
        monthEnd: end
    }
}