const express = require("express");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

router.post("/profile/from-cv", candidateController.createProfileFromCv);
router.get("/profile/:userId", candidateController.getProfile);
router.get("/:userId/topics", candidateController.getTopics);
router.get("/:userId/adaptive-strategy", candidateController.getAdaptiveStrategy);
router.post("/:userId/performance", candidateController.updatePerformance);

module.exports = router;
