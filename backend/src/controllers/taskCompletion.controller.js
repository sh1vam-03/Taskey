import asyncHandler from "../utils/asyncHandler.js";
import * as     taskCompletionService from "../services/taskCompletion.service.js";


/**
 * @route   POST /api/tasks/:id/complete
 * @desc    Complete a task
 * @access  Private
 */

export const completeTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id } = req.params;
    const { date } = req.body;

    // Input Validation
    const task = await taskCompletionService.completeTask(userId, id, date);

    res.status(200).json({
        success: true,
        message: "Task completed successfully"
    });
});


/**
 * @route   DELETE /api/tasks/:id/completed
 * @desc    Undo a task completion
 * @access  Private
 */

export const undoTaskCompletion = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id } = req.params;
    const { date } = req.body;

    // Input Validation
    await taskCompletionService.undoTaskCompletion(userId, id, date);

    res.status(200).json({
        success: true,
        message: "Task completion undone successfully"
    });
});


/**
 * @route   GET /api/tasks/:id/completed-history
 * @desc    Get a task completion history
 * @access  Private
 */

export const getTaskCompletion = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id: taskId } = req.params;

    const completion = await taskCompletionService.getTaskCompletion(userId, taskId);

    res.status(200).json({
        success: true,
        message: "Task completion retrieved successfully",
        data: completion
    });
});

/**
 * @route   POST /api/tasks/complete-bulk
 * @desc    Complete multiple tasks
 * @access  Private
 */

export const completeBulkTasks = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { taskIds, date } = req.body;

    // Input Validation
    const result = await taskCompletionService.completeBulkTasks(userId, taskIds, date);

    res.status(200).json({
        success: true,
        message: "Bulk tasks completed successfully",
        data: result
    });
});
