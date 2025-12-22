import * as publicPagesService from "../services/publicPages.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * @route POST /api/public-pages/contact-us
 * @desc Create a new contact us entry
 * @access Public
 */

export const createContactUs = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Input Validation
    if (!name || !email || !subject || !message) {
        throw new ApiError("All fields are required", 400);
    }

    // Call Service
    const result = await publicPagesService.createContactUs({ name, email, subject, message });

    // Send Response
    return res.status(201).json({
        success: true,
        message: "Your contact us message has been sent successfully",
        data: {
            name: result.name,
            subject: result.subject,
        },
    });
});
