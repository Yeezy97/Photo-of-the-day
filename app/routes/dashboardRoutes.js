// library imports
const express = require("express");
const router = express.Router();
const multer = require("multer");

// Multer settings
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// internal imports
const dashboardController = require("../controller/dashboardController");
const postController = require("../controller/postController");
const { authenticateToken } = require("../utils/utility");

router.route("/").get(authenticateToken, dashboardController.getDashboard);

router
  .route("/favourite-post")
  .get(authenticateToken, dashboardController.getFavouritePost)
  .post(authenticateToken, dashboardController.addtFavouritePost)
  .delete(authenticateToken, dashboardController.deleteFavouritePost);

router
  .route("/create-post")
  .get(authenticateToken, postController.getCreatePost)
  .post(upload.single("image"), authenticateToken, postController.createPost);

router
  .route("/profile")
  .get(authenticateToken, dashboardController.getProfile)
  .post(
    authenticateToken,
    upload.single("image"),
    dashboardController.editProfile
  );

router.route("/like-post").post(postController.likepost);

module.exports = router;
