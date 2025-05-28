import { Router } from "express";
import { userController } from "../controllers/userController";

const router = Router();
router.post("/nonce", userController.requestNonce);
router.post("/verify", userController.verifySignature);
router.post("/register", userController.register);
export default router; 