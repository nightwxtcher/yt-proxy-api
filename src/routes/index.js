const { Router } = require("express");
const searchRoutes = require("./search.routes");
const videoRoutes = require("./video.routes");
const proxyRoutes = require("./proxy.routes");

const router = Router();

router.use("/search", searchRoutes);
router.use("/", videoRoutes);
router.use("/", proxyRoutes);

module.exports = router;
