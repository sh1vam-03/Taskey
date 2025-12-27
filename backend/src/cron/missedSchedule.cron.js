import cron from "node-cron";
import prisma from "../config/db.js";

cron.schedule("5 0 * * *", async () => {
    console.log("🕒 Running MISSED schedule cron");

    const now = new Date();

    // Get schedules that ended yesterday or earlier
    const schedules = await prisma.schedule.findMany({
        where: {
            scheduleDate: { lt: now }
        },
        select: {
            id: true,
            userId: true
        }
    });

    if (!schedules.length) return;

    // Already completed
    const completed = await prisma.taskCompletion.findMany({
        where: {
            scheduleId: { in: schedules.map(s => s.id) }
        },
        select: { scheduleId: true }
    });

    const completedSet = new Set(completed.map(c => c.scheduleId));

    // Already marked missed
    const missed = await prisma.missedSchedule.findMany({
        where: {
            scheduleId: { in: schedules.map(s => s.id) }
        },
        select: { scheduleId: true }
    });

    const missedSet = new Set(missed.map(m => m.scheduleId));

    const toInsert = schedules
        .filter(s => !completedSet.has(s.id) && !missedSet.has(s.id))
        .map(s => ({
            scheduleId: s.id,
            userId: s.userId
        }));

    if (toInsert.length) {
        await prisma.missedSchedule.createMany({
            data: toInsert,
            skipDuplicates: true
        });
    }

    console.log(`✅ Marked ${toInsert.length} schedules as MISSED`);
});
