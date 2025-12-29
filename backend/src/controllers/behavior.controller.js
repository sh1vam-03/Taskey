import * as behaviorService from "../services/behavior.service.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ---------------- UPSERT ---------------- */

export const upsertBehavior = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await behaviorService.upsertBehaviorLog(userId, req.body);

    res.status(200).json({
        success: true,
        message: "Behavior log saved successfully",
        data
    });
});

/* ---------------- GET BY DATE ---------------- */

export const getBehaviorByDate = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { date } = req.params;
    if (!date) {
        return res.status(400).json({ success: false, message: "Date is required" });
    }

    const data = await behaviorService.getBehaviorLogByDate(userId, date);

    res.json({
        success: true,
        data
    });
});

/* ---------------- SUMMARY ---------------- */

export const getBehaviorSummary = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const days = Number(req.query.days) || 7;

    const summary = await behaviorService.getBehaviorSummary(userId, days);

    res.status(200).json({
        success: true,
        message: "Behavior summary fetched successfully",
        data: summary
    });
});
