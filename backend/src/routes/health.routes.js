import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "API is healthy",
    time: new Date().toISOString()
  });
});

export default router;
