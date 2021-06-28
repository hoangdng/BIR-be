const express = require("express");
const controller = require("../controllers/books.controller");
const router = express.Router();

//Import multer for processing multi media
const multer = require("multer");
const upload = multer();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", upload.array("images", 2), controller.create);
router.put("/:id", upload.array("images", 2), controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
