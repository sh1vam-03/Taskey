import * as categoriesService from "../services/category.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


/**
 * @route POST /api/categories
 * @desc Create category
 * @access Private
 */

export const createCategory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { name, color, icon } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Name is required");
    }

    const category = await categoriesService.createCategory(userId, name, color, icon);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category
    });
});

/**
 * @route GET /api/categories
 * @desc Get all categories
 * @access Private
 */

export const getCategories = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const categories = await categoriesService.getCategories(userId);

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories
    });
});


/**
 * @route GET /api/categories/:id
 * @desc Get category by id
 * @access Private
 */
export const getCategory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const category = await categoriesService.getCategory(userId, id);

    res.status(200).json({
        success: true,
        message: "Category fetched successfully",
        data: category
    });
});



/**
 * @route PUT /api/categories/:id
 * @desc Update category
 * @access Private
 */

export const updateCategory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, color, icon } = req.body;

    if (!name && color === undefined && icon === undefined) {
        throw new ApiError(400, "At least one field is required");
    }

    const category = await categoriesService.updateCategory(userId, id, { name, color, icon });

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category
    });
});


/**
 * @route DELETE /api/categories/:id
 * @desc Delete category
 * @access Private
 */

export const deleteCategory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;

    await categoriesService.deleteCategory(userId, id);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully"
    });
});
