const { Router } = require("express");
const { handleProxy } = require("../controllers/proxy.controller");

const router = Router();
router.get("/proxy", handleProxy);

module.exports = router;
