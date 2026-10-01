import { Router } from "express";
import {
  connect,
  getTranscript,
  getStudyPlan,
  getStudentSummary,
  getStudentName,
  getStudentId,
  getDegreeCourse
} from "../controllers/segrepass.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/connect", connect);
router.get("/transcript", requireAuth, getTranscript);
router.get("/study-plan", requireAuth, getStudyPlan);
router.get("/student-summary", requireAuth, getStudentSummary);
router.get("/student-name", requireAuth, getStudentName);
router.get("/student-id", requireAuth, getStudentId);
router.get("/degree-course", requireAuth, getDegreeCourse);

export default router;