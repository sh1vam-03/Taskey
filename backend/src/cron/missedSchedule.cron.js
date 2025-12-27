import cron from "node-cron";
import prisma from "../config/db.js";
import { isAfter, isBefore, isEqual } from "date-fns";

/**
 * Check if schedule applies on a specific date
 */
const appliesOnDate = (schedule, date) => {
    const scheduleDate = startOfDay(schedule.scheduleDate);
    const checkDate = startOfDay(date);

    if (isBefore(checkDate, scheduleDate)) return false;
    if (schedule.repeatUntil && isAfter(checkDate, schedule.repeatUntil)) return false;

    switch (schedule.recurrence) {
        case "NONE":
            return isEqual(checkDate, scheduleDate);

        case "DAILY":
            return true;

        case "WEEKLY":
            return schedule.repeatOnDays.includes(checkDate.getUTCDay());

        case "MONTHLY":
            return checkDate.getUTCDate() === scheduleDate.getUTCDate();

        default:
            return false;
    }
};

const startOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

/**
 * Runs every day at 00:05 AM
 */
cron.schedule("5 0 * * *", async () => {
    console.log("🕒 Running MISSED schedule cron");

    try {
        // 🔹 Yesterday (UTC)
        const missedOn = new Date();
        missedOn.setUTCDate(missedOn.getUTCDate() - 1);
        missedOn.setUTCHours(0, 0, 0, 0);

        // 1️⃣ Get schedules active up to yesterday
        const schedules = await prisma.schedule.findMany({
            where: {
                scheduleDate: { lte: missedOn },
                OR: [
                    { repeatUntil: null },
                    { repeatUntil: { gte: missedOn } }
                ]
            },
            select: {
                id: true,
                userId: true,
                scheduleDate: true,
                recurrence: true,
                repeatUntil: true,
                repeatOnDays: true
            }
        });

        if (!schedules.length) return;

        // 2️⃣ Get completions for yesterday
        const completed = await prisma.scheduleCompletion.findMany({
            where: {
                completedOn: missedOn
            },
            select: { scheduleId: true }
        });

        const completedSet = new Set(completed.map(c => c.scheduleId));

        // 3️⃣ Get already missed records for yesterday
        const alreadyMissed = await prisma.missedSchedule.findMany({
            where: {
                missedOn
            },
            select: { scheduleId: true }
        });

        const missedSet = new Set(alreadyMissed.map(m => m.scheduleId));

        // 4️⃣ Build inserts
        const toInsert = [];

        for (const schedule of schedules) {
            if (!appliesOnDate(schedule, missedOn)) continue;
            if (completedSet.has(schedule.id)) continue;
            if (missedSet.has(schedule.id)) continue;

            toInsert.push({
                scheduleId: schedule.id,
                userId: schedule.userId,
                missedOn
            });
        }

        // 5️⃣ Insert missed records
        if (toInsert.length > 0) {
            await prisma.missedSchedule.createMany({
                data: toInsert,
                skipDuplicates: true
            });
        }

        console.log(`✅ Marked ${toInsert.length} schedules as MISSED for ${missedOn.toISOString().slice(0, 10)}`);
    } catch (err) {
        console.error("❌ MISSED schedule cron failed:", err);
    }
});
