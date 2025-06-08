import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);

export default app; 