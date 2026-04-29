const express = require("express");
const mediaController = require("../controllers/mediaController");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/upload", uploadMiddleware.single("file"), mediaController.uploadMedia);
router.get("/:id/status", mediaController.getMediaStatus);
router.get("/:id/access", mediaController.getMediaAccess);
router.get("/:id/file", mediaController.streamMediaFile);
router.get("/:id", mediaController.getMediaById);

module.exports = router;
