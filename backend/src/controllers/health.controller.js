

/**
 * @route GET /api/health
 * @desc Health check
 * @access Public
 */

export const healthCheck = asyncHandler(async (req, res) => {
    res.json({ message: "Api is working..." });
});