const { Router } = require("express");
const { resolveVideo, resolveAudio, downloadAudio } = require("../controllers/video.controller");

const router = Router();
router.get("/video/:id", resolveVideo);
router.get("/audio/:id", resolveAudio);
router.get("/download/:id", downloadAudio);

module.exports = router;
