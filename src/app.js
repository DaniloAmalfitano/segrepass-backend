import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";
import { config as env } from "./config/env.js";

import segrepassRoutes from "./routes/segrepass.routes.js";
import authRoutes from "./routes/auth.routes.js";

export const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://myuni-cfb7e.web.app"
    ],
    credentials: true,
    allowedHeaders: ["Content-Type","Authorization","X-Session-Id"],
    methods: ["GET","POST","PUT","DELETE","OPTIONS"]
}));

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
    });
});

app.use("/segrepass", segrepassRoutes);
app.use("/auth", authRoutes);

export default app;