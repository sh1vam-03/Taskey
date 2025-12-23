import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as taskCompletionController from "../controllers/taskCompletion.controller.js";

const router = express.Router();

router.post("/:id/complete", authMiddleware, taskCompletionController.completeTask);
router.delete("/:id/completed", authMiddleware, taskCompletionController.undoTaskCompletion);

export default router;