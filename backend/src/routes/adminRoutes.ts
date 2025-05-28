import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
router.use(authMiddleware);
router.get("/dashboard", adminController.getDashboard);
export default router; 