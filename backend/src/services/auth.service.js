import prisma from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { signToken } from "../utils/jwt.js";
import { generateOtp } from "../utils/otp.js";
import { addMinutes } from "date-fns";
import { OtpPurpose } from "../prisma/enums.js";
import { ApiError } from "../utils/ApiError.js";

export const signup = async (name, email, password) => {

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        }
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    });


    // Generate OTP
    const otp = generateOtp();

    // Store OTP in database
    await prisma.otp.create({
        data: {
            code: otp,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
            expiresAt: addMinutes(new Date(), 10),
            userId: user.id
        }
    });

    // TODO: Send OTP via email (integrate email service here)
    // await emailService.sendOtp(email, otp);

    return {
        userId: user.id,
        email: user.email,
        message: "OTP sent successfully to your email",
    };
};

export const verifyOtp = async (email, otpCode) => {

    // Find user by email
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
        where: {
            userId: user.id,
            code: otpCode,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
            isUsed: false,
            expiresAt: {
                gte: new Date(),
            }
        }
    });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (otpRecord.expiresAt < new Date()) {
        throw new ApiError(400, "OTP expired");
    }

    // Mark user as verified
    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            isEmailVerified: true
        }
    });

    // Mark OTP as used
    await prisma.otp.update({
        where: {
            id: otpRecord.id
        },
        data: {
            isUsed: true
        }
    });

    // Generate JWT token
    const token = signToken({
        userId: user.id,
        email: user.email,
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
        }
    };
};

export const login = async (email, password) => {

    // Find user by email
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Verify email verification
    if (!user.isEmailVerified) {
        throw new ApiError(401, "Email not verified");
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate token
    const token = signToken({
        userId: user.id,
        email: user.email,
    });

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
        }
    };
};

export const otpRequest = async (email) => {

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    // Invalidate previous OTPs
    await prisma.otp.updateMany({
        where: {
            userId: user.id,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
            isUsed: false,
        },
        data: {
            isUsed: true,
        }
    });

    // Generate new OTP
    const otpCode = generateOtp();

    await prisma.otp.create({
        data: {
            code: otpCode,
            purpose: OtpPurpose.EMAIL_VERIFICATION,
            expiresAt: addMinutes(new Date(), 10),
            userId: user.id
        }
    });

    // TODO: Send OTP via email (integrate email service here)
    // await emailService.sendOtp(email, otpCode);

    return { message: "OTP send successfully" };
}



export const forgotPasswordOtp = async (email) => {

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email already verified");
    }

    // Invalidate previous OTPs
    await prisma.otp.updateMany({
        where: {
            userId: user.id,
            purpose: OtpPurpose.PASSWORD_RESET,
            isUsed: false,
        },
        data: {
            isUsed: true,
        }
    });

    // Generate new OTP
    const otpCode = generateOtp();

    await prisma.otp.create({
        data: {
            code: otpCode,
            purpose: OtpPurpose.PASSWORD_RESET,
            expiresAt: addMinutes(new Date(), 10),
            userId: user.id
        }
    });

    // TODO: Send OTP via email (integrate email service here)
    // await emailService.sendOtp(email, otpCode);

    return { message: "OTP send successfully" };
}


export const resetPassword = async (email, otp, password) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Verify OTP
    const otpRecord = await prisma.otp.findFirst({
        where: {
            userId: user.id,
            code: otp,
            purpose: OtpPurpose.PASSWORD_RESET,
            isUsed: false,
            expiresAt: {
                gte: new Date(),
            }
        }
    });

    if (!otpRecord) {
        throw new ApiError(404, "OTP not found");
    }

    if (otpRecord.expiresAt < new Date()) {
        throw new ApiError(400, "OTP expired");
    }

    if (otpRecord.code !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Mark OTP as used
    await prisma.otp.update({
        where: {
            id: otpRecord.id
        },
        data: {
            isUsed: true
        }
    });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            password: hashedPassword
        }
    });

    return { message: "Password reset successfully" };
}


export const logout = async (userId) => {

    // Find user by id
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // No DB action needed for stateless JWT
    // Because we are using only access token which is need to remove from local storage and cache
    // Note secure - when attacker are able to get access to access token then they can use it to make requests on behalf of user
    // TODO : implement letter refresh token
    return { message: "Logout successfully" };
}