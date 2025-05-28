import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";

export const doctorController = {
  getProfile: (req: AuthRequest, res: Response) => {
    res.json({ role: "doctor", address: req.address });
  },
  // add other doctor-specific endpoints
}; 