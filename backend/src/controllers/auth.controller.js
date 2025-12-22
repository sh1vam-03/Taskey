import * as authService from "../services/auth.service";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/appError";


/**
 * @route POST /api/auth/signup
 * @desc Register a new user and send OTP
 * @access Public
 */

export const signup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Input Validation
    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // Call Service
    const result = await authService.signup(name, email, password);

    // Send Response
    return res.status(201).json({
        success: true,
        message: result.message,
        data: {
            email: result.email,
        },
    });

});


/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and return JWT token
 * @access Public
 */

export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Input Validation
    if (!email || !otp) {
        throw new ApiError(400, "Please provide email and OTP");
    }

    // Call Service
    const result = await authService.verifyOtp(email, otp);

    // Send Response
    return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: {
            token: result.token,
            user: result.user,
        },
    });
});


/**
 * @route POST /api/auth/login
 * @desc Login a user and return JWT token
 * @access Public
 */

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Input Validation
    if (!email || !password) {
        throw new ApiError(400, "Please provide email and password");
    }

    // Call Service
    const result = await authService.login(email, password);

    // Send Response
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            token: result.token,
            user: result.user,
        },
    });
});


/**
 * @route Post /api/auth/otp-request
 * @desc Reset otp and return JWT token
 * @access Public
 */

export const otpRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Input Validation
    if (!email) {
        throw new ApiError(400, "Please provide email");
    }

    // Call Service
    const result = await authService.otpRequest(email);

    // Send Response
    return res.status(200).json({
        success: true,
        data: {
            message: result.message,
        },
    });
});


/**
 * @route POST /api/auth/forgot-password
 * @desc Forgot password and send OTP
 * @access Public
 */

export const forgotPasswordOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Input Validation
    if (!email) {
        throw new ApiError(400, "Please provide email");
    }

    // Call Service
    const result = await authService.forgotPasswordOtp(email);

    // Send Response
    return res.status(200).json({
        success: true,
        data: {
            message: result.message,
        },
    });
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password
 * @access Public
 */

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    // Input Validation
    if (!email || !otp || !password) {
        throw new ApiError(400, "Please provide email, OTP and password");
    }

    // Call Service
    const result = await authService.resetPasswordOtp(email, otp, password);

    // Send Response
    return res.status(200).json({
        success: true,
        data: {
            message: result.message,
        },
    });
});


/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */

export const logout = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    // Input Validation
    if (!userId) {
        throw new ApiError(400, "Please provide user ID");
    }

    // Call Service
    const result = await authService.logout(userId);

    // Send Response
    return res.status(200).json({
        success: true,
        message: "Logout successfully",
        data: {
            email: result.email,
        },
    });
});