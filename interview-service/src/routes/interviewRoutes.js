const express = require("express");
const interviewController = require("../controllers/interviewController");

const router = express.Router();

router.post("/", interviewController.createInterview);
router.get("/", interviewController.listInterviews);
router.get("/:id", interviewController.getInterview);
router.post("/:id/start", interviewController.startInterview);
router.post("/:id/finish", interviewController.finishInterview);
router.post("/:id/abandon", interviewController.abandonInterview);
router.get("/:id/evaluation-payload", interviewController.getEvaluationPayload);
router.get("/:id/evaluation-data", interviewController.getEvaluationPayload);

module.exports = router;
