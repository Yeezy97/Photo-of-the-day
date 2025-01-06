// library imports
const jwt = require("jsonwebtoken");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");

// internal imports
const { User } = require("../models/Users");

dotenv.config();

// S3 bucket Info
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.BUCKET_SECRET_KEY;

// Token KEY
const secretKey = process.env.TOKEN_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const getLogin = (req, res) => {
  res.render("login");
};

const submitLogin = async (req, res) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return res
      .status(400)
      .render("login", { error: "Please provide a email and password!" });
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
          user = {
            userId: userObj.user_id,
            email: userObj.email,
            username: userObj.username,
            profile_pic_url: url,
          };
        } else {
          //save image to aws s3 bucket
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

        // create jwt token
        const token = jwt.sign(user, secretKey, { expiresIn: "1h" });

        // Set cookie with the token
        res.cookie("token", token);
        res.redirect("/dashboard");
      } else {
        res.render("login", { error: "Invalid email or password" });
      }
    } else {
      res.render("login", { error: "Invalid email or password" });
    }
  } catch (err) {
    console.error(`Error while comparing `, err.message);
    res.render("login", { error: "Something went wrong, try again." });
  }
};

const getSignout = (req, res) => {
  res.render("signup");
};

const signup = async (req, res) => {
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
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
};

module.exports = { getLogin, submitLogin, logout, getSignout, signup };
