import { Router } from "express";
import {
  connect,
  getTranscript,
  getStudyPlan,
  getStudentSummary
} from "../controllers/segrepass.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/connect", requireAuth, connect);
router.get("/transcript", requireAuth, getTranscript);
router.get("/study-plan", requireAuth, getStudyPlan);
router.get("/student-summary", requireAuth, getStudentSummary);

export default router;