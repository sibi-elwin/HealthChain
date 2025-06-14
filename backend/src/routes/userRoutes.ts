import { Router } from "express";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/nonce", userController.requestNonce);
router.post("/verify", userController.verifySignature);
router.post("/register", userController.register);
router.post("/login", userController.login);

// Protected routes
router.use(authMiddleware);

router.get("/:walletAddress/roles", userController.checkUserRoles);
router.get("/:walletAddress/medical-records", userController.getMedicalRecords);
router.post("/:walletAddress/medical-records", userController.uploadMedicalRecord);
router.post("/:walletAddress/medical-records/:recordId/revoke-access", userController.revokeAccess);
router.post("/:walletAddress/medical-records/:recordId/access-granted-db", userController.recordAccessGrantedDb);
router.get("/:walletAddress/public-key", userController.getPublicKey);
router.get("/:walletAddress/access-requests", userController.getAccessRequests);
router.post("/:walletAddress/access-requests/:requestId/review", userController.reviewAccessRequest);
router.get("/:walletAddress/notifications", userController.getNotifications);
router.post("/:walletAddress/notifications/:notificationId/read", userController.markNotificationAsRead);
router.get("/patient/notification-preferences", userController.getNotificationPreferences);
router.put("/patient/notification-preferences", userController.updateNotificationPreferences);
router.get("/validate-token", userController.validateToken);
router.get("/dashboard-stats", userController.getDashboardStats);
router.get("/:walletAddress", userController.getUserByWalletAddress);

export default router; 