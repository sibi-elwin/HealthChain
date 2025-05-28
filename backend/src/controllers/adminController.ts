import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";

export const adminController = {
  getDashboard: (req: AuthRequest, res: Response) => {
    res.json({ role: "admin", address: req.address });
  },
  // add other admin-specific endpoints
}; 