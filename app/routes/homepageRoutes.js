// library imports
const express = require("express");
const router = express.Router();

// internal imports
const postController = require("../controller/postController");

router.route("/").get(postController.getAllPost);
router.route("/category").get(postController.getCategory);
router.route("/category/:id").get(postController.getCategoryById);
router.route("/about").get(postController.getAbout);

module.exports = router;
