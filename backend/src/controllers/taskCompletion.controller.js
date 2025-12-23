import asyncHandler from "../utils/asyncHandler.js";
import taskCompletionService from "../services/taskCompletion.service.js";


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
    const task = await taskService.completeTask(userId, id, date);

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
    await taskService.undoTaskCompletion(userId, id, date);

    res.status(200).json({
        success: true,
        message: "Task completion undone successfully"
    });
});
