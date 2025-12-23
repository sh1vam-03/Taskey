import prisma from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export const createCategory = async (userId, name, color, icon) => {
    const normalizedName = name.trim();

    // Check duplicate category name
    const existingCategory = await prisma.category.findFirst({
        where: {
            userId,
            name: normalizedName
        }
    });

    if (existingCategory) {
        throw new ApiError(400, "Category already exists");
    }

    const category = await prisma.category.create({
        data: {
            name: normalizedName,
            color,
            icon,
            userId
        }
    });
    return category;
};

export const getCategories = async (userId) => {
    const categories = await prisma.category.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    return categories;
};


export const getCategory = async (userId, categoryId) => {
    // veryify owner of category exists
    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            userId
        }
    });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    return category;
};

export const updateCategory = async (userId, id, data) => {
    const { name, color, icon } = data;

    // Verify owner of category exists
    const category = await prisma.category.findFirst({
        where: {
            id,
            userId
        }
    });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Normalize name
    let normalizedName = null;
    if (name) {
        normalizedName = name.trim();

        if (!normalizedName) {
            throw new ApiError(400, "Category name cannot be empty");
        }
    }

    // Check duplicate category name
    const existingCategory = await prisma.category.findFirst({
        where: {
            userId,
            name: normalizedName,
            NOT: {
                id
            }
        }
    });

    if (existingCategory) {
        throw new ApiError(400, "Category name already exists");
    }

    const updatedCategory = await prisma.category.update({
        where: {
            id,
        },
        data: {
            ...(normalizedName && { name: normalizedName }),
            ...(color !== undefined && { color }),
            ...(icon !== undefined && { icon })
        }
    });
    return updatedCategory;
};

export const deleteCategory = async (userId, categoryId) => {

    // veryify owner of category exists
    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            userId
        }
    });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    await prisma.category.delete({
        where: {
            id: categoryId
        }
    });

    return;
};