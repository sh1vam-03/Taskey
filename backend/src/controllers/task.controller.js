import * as taskService from "../services/task.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { TaskPriority } from "@prisma/client";

/**
 * @route   POST /api/tasks
 * @desc    Create a task
 * @access  Private
 */

export const createTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { title, description, priority, dueDate, categoryId } = req.body;

    if (!title || !title.trim()) {
        throw new ApiError(400, "Title is required");
    }

    if (priority && !Object.values(TaskPriority).includes(priority)) {
        throw new ApiError(400, "Invalid priority");
    }

    const task = await taskService.createTask(userId, { title, description, priority, dueDate, categoryId, userId });

    res.status(201).json(task);
})


/**
 * @route   GET /api/tasks
 * @desc    Get all tasks
 * @access  Private
 */

export const getTasks = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT

    // Input Validation
    const result = await taskService.getTasks(userId, req.query);

    res.status(200).json(result);
});


/**
 * @route   GET /api/tasks/:id
 * @desc    Get a task
 * @access  Private
 */

export const getTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id } = req.params;

    // Input Validation
    const task = await taskService.getTask(userId, id);

    res.status(200).json(task);
});


/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */

export const updateTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id } = req.params;

    // Input Validation
    const task = await taskService.updateTask(userId, id, req.body);

    res.status(200).json(task);
});



/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */

export const deleteTask = asyncHandler(async (req, res) => {
    const userId = req.user.userId; //From JWT
    const { id } = req.params;

    // Input Validation
    await taskService.deleteTask(userId, id);

    res.status(200).json({
        success: true,
        message: "Task deleted successfully"
    });
});
