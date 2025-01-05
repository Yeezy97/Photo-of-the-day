const express = require("express");

const router = express.Router();
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
const db = require("../services/db");

const crypto = require("crypto");
const multer = require("multer");

dotenv.config();

// Multer settings
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.BUCKET_SECRET_KEY;

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const secretKey = process.env.TOKEN_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { User } = require("../models/Users");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/auth/login"); // No token -> go to login
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.redirect("/auth/login"); // Invalid token -> go to login
    }

    //    user {
    //   username: 'v1',
    //   profile_pic: '/image/samImg.jpg',
    //   iat: 1735589537,
    //    exp: 1735593137
    //  }
    req.user = user; // Attach user data to request
    console.log(req.user, "from auth middleware");

    next();
  });
};

router
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(async (req, res) => {
    const { email, password } = req.body;

    console.log(req.body, email, password);

    // 1) Check if email and password exist
    if (!email || !password) {
      return res
        .status(400)
        .render("login", { error: "Please provide a email and password!" }); // render the same view with an error message
    }

    let userModel = new User(email);

    let userObj = {};
    try {
      uId = await userModel.getIdFromEmail();
      if (uId) {
        // check password match
        userObj = await userModel.authenticate(password);
        let user = {};
        // if password matched
        if (userObj) {
          if (userObj.profile_pic === "/image/profileImage.png") {
            let url = "/image/profileImage.png";
            console.log("profile pic match");

            user = {
              userId: userObj.user_id,
              email: userObj.email,
              username: userObj.username,
              profile_pic_url: url,
            };
          } else {
            console.log("profile pic notttttt match");

            let getObjParams = {
              Bucket: bucketName,
              Key: userObj.profile_pic,
            };
            let command = new GetObjectCommand(getObjParams);
            let url = await getSignedUrl(s3, command, { expiresIn: 3600 });

            user = {
              userId: userObj.user_id,
              email: userObj.email,
              username: userObj.username,
              profile_pic_url: url,
            };
          }
          // get profile pic and set to token

          const token = jwt.sign(user, secretKey, { expiresIn: "1h" });

          // Set the cookie with the token
          // res.cookie("token", token, { httpOnly: true });
          res.cookie("token", token);
          res.redirect("/dashboard");
        } else {
          // TODO improve the user journey here
          res.render("login", { error: "Invalid email or password" });
        }
      } else {
        res.render("login", { error: "Invalid email or password" });
      }
    } catch (err) {
      console.error(`Error while comparing `, err.message);
    }
  });

router.route("/logout").get((req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
});

router
  .route("/signup")
  .get(function (req, res) {
    res.render("signup");
  })
  .post(async function (req, res) {
    console.log(req.body);
    const { email, password, username, fname, lname, gender } = req.body;
    let user = new User(req.body.email);
    let userAddSuccess = await user.addUser(
      email,
      password,
      username,
      fname,
      lname,
      gender
    );
    if (userAddSuccess) {
      res.redirect("/auth/login");
    } else {
      res.render("signup", { message: "Something went wrong try again" });
    }
  });

module.exports = router;
