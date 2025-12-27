import cron from "node-cron";
import prisma from "../config/db.js";

/**
 * Normalize to UTC start of day
 */
const utcDay = (d) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/**
 * Runs every day at 00:05 UTC
 */
cron.schedule("5 0 * * *", async () => {
    const yesterday = utcDay(new Date());
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    console.log("🕒 MISSED CRON:", yesterday.toISOString().slice(0, 10));

    try {
        await prisma.$transaction(async (tx) => {

            /* =====================================================
               1️⃣ SCHEDULED TASKS (MOST IMPORTANT)
            ===================================================== */

            const schedules = await tx.schedule.findMany({
                where: {
                    scheduleDate: { lte: yesterday },
                    OR: [
                        { repeatUntil: null },
                        { repeatUntil: { gte: yesterday } }
                    ]
                },
                select: {
                    id: true,
                    userId: true,
                    recurrence: true,
                    repeatOnDays: true,
                    scheduleDate: true
                }
            });

            if (!schedules.length) return;

            const completed = await tx.scheduleCompletion.findMany({
                where: { completedOn: yesterday },
                select: { scheduleId: true }
            });

            const completedSet = new Set(completed.map(c => c.scheduleId));

            const alreadyMissed = await tx.missedSchedule.findMany({
                where: { missedOn: yesterday },
                select: { scheduleId: true }
            });

            const missedSet = new Set(alreadyMissed.map(m => m.scheduleId));

            const toInsert = [];

            for (const s of schedules) {
                if (completedSet.has(s.id)) continue;
                if (missedSet.has(s.id)) continue;

                // recurrence check
                if (s.recurrence === "WEEKLY" && !s.repeatOnDays.includes(yesterday.getUTCDay())) continue;
                if (s.recurrence === "MONTHLY" && s.scheduleDate.getUTCDate() !== yesterday.getUTCDate()) continue;

                toInsert.push({
                    scheduleId: s.id,
                    userId: s.userId,
                    missedOn: yesterday
                });
            }

            if (toInsert.length) {
                await tx.missedSchedule.createMany({
                    data: toInsert,
                    skipDuplicates: true
                });
            }

            console.log(`✅ Schedules MISSED: ${toInsert.length}`);
        });

    } catch (err) {
        console.error("❌ MISSED CRON FAILED", err);
    }
});
