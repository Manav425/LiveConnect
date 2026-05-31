import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAIResponse } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", protectRoute, getAIResponse);

export default router;