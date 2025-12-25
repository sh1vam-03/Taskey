import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const getDayCalender = async (dateString, userId) => {
    if (!dateString) {
        dateString = new Date().toISOString().split("T")[0];
    }

    const startOfDayUTC = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDayUTC = new Date(`${dateString}T23:59:59.999Z`);

    if (isNaN(startOfDayUTC.getTime()) || isNaN(endOfDayUTC.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    // Fetch schedules
    const schedules = await prisma.schedule.findMany({
        where: {
            userId,
            OR: [
                {
                    scheduleDate: {
                        gte: startOfDayUTC,
                        lte: endOfDayUTC
                    },
                    recurrence: "NONE"
                },
                {
                    recurrence: {
                        not: "NONE"
                    },
                    scheduleDate: {
                        lte: endOfDayUTC,
                    },
                    repeatUntil: {
                        gte: startOfDayUTC
                    }
                }
            ]
        },
        include: {
            task: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                }
            }
        },
        orderBy: [
            { startTime: "asc" }
        ]
    });

    const daySchedules = schedules.filter(schedule => appliesOnDate(schedule, dateString));

    // Fetch completions for the day
    const completions = await prisma.taskCompletion.findMany({
        where: {
            userId,
            completedDate: {
                gte: startOfDayUTC,
                lte: endOfDayUTC
            }
        }
    });

    const completedTaskIds = new Set(completions.map(completion => completion.taskId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestLocalDate = new Date(`${dateString}T00:00:00.00`);

    const userTimeZone = "Asia/Kolkata";
    const response = [];

    // Classify schedules
    for (const schedule of daySchedules) {

        const start = toZonedTime(schedule.startTime, userTimeZone);
        const end = toZonedTime(schedule.endTime, userTimeZone);


        const isCompleted = completedTaskIds.has(schedule.taskId);

        let status = "PENDING";
        if (isCompleted) status = "COMPLETED";
        else if (requestLocalDate < today) status = "MISSED";

        response.push({
            scheduleId: schedule.id,
            taskId: schedule.task.id,
            title: schedule.task.title,
            priority: schedule.task.priority,
            startTime: format(start, "HH:mm"),
            endTime: format(end, "HH:mm"),
            status
        })
    };


    return {
        date: dateString,
        schedules: response
    };

}

//Helper 
function appliesOnDate(schedule, dateString) {
    const localDate = new Date(`${dateString}T00:00:00.00`);
    const day = localDate.getDay();

    if (schedule.recurrence === "DAILY") {
        return true;
    }

    if (schedule.recurrence === "WEEKLY") {
        return schedule.repeatOnDays.includes(day);
    }

    if (schedule.recurrence === "MONTHLY") {
        return schedule.scheduleDate.getDate() === localDate.getDate()

    }

    return true;

}

export const getWeekCalender = async (dateString, userId) => {
    if (!dateString) {
        dateString = new Date().toISOString().split("T")[0];
    }

    const baseDate = new Date(`${dateString}T00:00:00Z`);

    if (isNaN(baseDate.getTime())) {
        throw new ApiError(400, "Invalid date format");
    }

    const { weekStart, weekEnd } = getWeekRange(baseDate);

    const days = [];
    const current = new Date(weekStart);

    while (current <= weekEnd) {
        const isoDate = current.toISOString().split("T")[0];

        // Reuse Day Logic
        const dayData = await getDayCalender(isoDate, userId);

        days.push(dayData);
        current.setDate(current.getDate() + 1);
    }


    return {
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        days
    }
}

// Helper for getWeekCalender
const getWeekRange = (date) => {

    const start = new Date(date);
    const day = start.getDay();

    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return {
        weekStart: start,
        weekEnd: end
    }
}

export const getMonthCalender = async (year, month, userId) => {
    if (!year || !month) {
        const now = new Date();
        year = now.getUTCFullYear();
        month = now.getUTCMonth() + 1;
    }

    const { monthStart, monthEnd } = getMonthRange(year, month);

    const days = [];
    const current = new Date(monthStart);

    while (current <= monthEnd) {
        const isoDate = current.toISOString().split("T")[0];

        // Reuse Day Logic
        const dayData = await getDayCalender(isoDate, userId);

        days.push(dayData);
        current.setDate(current.getDate() + 1);
    }

    return {
        month: `${year}-${String(month).padStart(2, "0")}`,
        days
    };
}

// Helper for getMonthCalender
const getMonthRange = (year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    end.setHours(23, 59, 59, 999);
    return {
        monthStart: start,
        monthEnd: end
    }
}