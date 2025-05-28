import { Router } from "express";
import { doctorController } from "../controllers/doctorController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.use(authMiddleware);
router.get("/profile", doctorController.getProfile);
export default router; 