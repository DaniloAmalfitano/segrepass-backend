import { Router } from "express";
import {  logout } from "../controllers/auth.controllers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

//router.post("/login", login);
router.post("/logout",requireAuth, logout);

export default router;