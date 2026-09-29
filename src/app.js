import express from "express";
import cookieParser from "cookie-parser";
import { config as env } from "./config/env.js";
import segrepassRoutes from "./routes/segrepass.routes.js";
import authRoutes from "./routes/auth.routes.js";


export const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/segrepass", segrepassRoutes);
app.use("/auth", authRoutes);

export default app;