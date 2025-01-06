// library imports
const express = require("express");
const router = express.Router();

// internal imports
const authController = require("../controller/authController");

router
  .route("/login")
  .get(authController.getLogin)
  .post(authController.submitLogin);

router.route("/logout").get(authController.logout);

router
  .route("/signup")
  .get(authController.getSignout)
  .post(authController.signup);

module.exports = router;
