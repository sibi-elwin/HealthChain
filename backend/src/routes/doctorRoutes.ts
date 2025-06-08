import { Router } from "express";
import { doctorController } from "../controllers/doctorController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Public routes (no auth required)
router.post("/nonce", doctorController.requestNonce);
router.post("/verify", doctorController.verifySignature);
router.post("/register", doctorController.register);
router.get("/verify/:walletAddress", doctorController.verifyDoctorRole);

// Protected routes (auth required)
router.use(authMiddleware);
router.get("/profile", doctorController.getProfile);
router.put("/profile", doctorController.updateProfile);
router.get("/accessible-medical-records", doctorController.getAccessibleMedicalRecords);
router.post("/access-request", doctorController.createAccessRequest);
router.get("/access-requests", doctorController.getAccessRequests);

export default router; 