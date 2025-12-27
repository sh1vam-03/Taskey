import { addDays, addWeeks, addMonths, isAfter } from "date-fns";

export const expandSchedule = (schedule, rangeStart, rangeEnd) => {
    const dates = [];
    let cursor = new Date(schedule.scheduleDate);

    while (!isAfter(cursor, rangeEnd)) {
        if (cursor >= rangeStart && appliesOnDate(schedule, cursor)) {
            dates.push(cursor.toISOString().slice(0, 10));
        }

        switch (schedule.recurrence) {
            case "DAILY":
                cursor = addDays(cursor, 1);
                break;
            case "WEEKLY":
                cursor = addWeeks(cursor, 1);
                break;
            case "MONTHLY":
                cursor = addMonths(cursor, 1);
                break;
            default:
                return dates;
        }
    }

    return dates;
};
