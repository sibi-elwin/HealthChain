import { Router } from "express";
import { userController } from "../controllers/userController";



const router = Router();
router.post("/nonce", userController.requestNonce);
router.post("/verify", userController.verifySignature);
router.post("/register", userController.register);
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

// For protected routes
export default router; 