import express from "express";
import * as authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.post("/otp-request", authController.otpRequest);
router.post("/forgot-password", authController.forgotPasswordOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/logout", authMiddleware, authController.logout);

export default router;
