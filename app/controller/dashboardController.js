// library imports
const jwt = require("jsonwebtoken");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");

// internal imports
const { User } = require("../models/Users");
const { Post } = require("../models/Posts");

const { verifyTokenExist, randomImageName } = require("../utils/utility");

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

const getDashboard = (req, res) => {
   const postModel = new Post();

  let result = await postModel.queryTotalLikes(req, res);

  let resultPost = await postModel.queryTotalPosts(req, res);

  res.render("dashboard", {
    user: req.user,
    totalLikes: result[0].total_likes,
    totalPosts: resultPost[0].total_posts,
  });
};

const getFavouritePost = async (req, res) => {
  const postModel = new Post();

  try {
    let results = await postModel.queryFavouritePost(req, res);

    for (let p of results) {
      let getObjParams = {
        Bucket: bucketName,
        Key: p.image_url,
      };
      let command = new GetObjectCommand(getObjParams);
      let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      p.imageURL = url;
    }

    res.render("favourite", { user: req.user, posts: results });
  } catch (s3Error) {
    console.error("Something went wrong", s3Error);
  }
};

const addtFavouritePost = async (req, res) => {
  let token = req.cookies.token;
  let userIdFvtPost = req.user.userId;

  verifyTokenExist(req, res);

  const postModel = new Post();

  if (token) {
    try {
      let results = await postModel.queryAddFvtPost(req, res, userIdFvtPost);
      //   res.json({ message: "Data is already present", status: true });
    } catch (error) {
      console.error("Error fetching S3 URL:", error);
    }
  } else {
    res.json({ message: "User not logged in" });
  }
};

const deleteFavouritePost = async (req, res) => {
  const postModel = new Post();

  try {
    let results = await postModel.queryDeleteFvtPost(req, res);

    res.json({ message: "Data is already present", status: true });
  } catch (error) {
    res.json({ message: "Something went wrong,try again" });
  }
};

const getProfile = (req, res) => {
  res.render("profile", { user: req.user });
};

const editProfile = async (req, res) => {
  let userModel = new User(req.user.email);

  const imageKey = randomImageName();
  if (req.file) {
    const params = {
      Bucket: bucketName,
      Key: imageKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // save image to s3 bucket
    const command = new PutObjectCommand(params);
    await s3.send(command);

    let userProfilePicupdated = await userModel.updateUserProfilePic(
      req.user.email,
      imageKey
    );
  }

  if (req.user.username !== req.body.username) {
    let userUsernameupdated = await userModel.updateUserUsername(
      req.user.email,
      req.body.username
    );
  }

  if (req.body.password !== "") {
    let userPasswordupdated = await userModel.updateUserPassword(
      req.user.email,
      req.body.password
    );
  }

  // create new token
  userModel = new User(req.user.email);

  let userObj = {};
  try {
    userdetails = await userModel.getUserDetails(req.user.email);

    let getObjParams = {
      Bucket: bucketName,
      Key: userdetails.profile_pic_url,
    };
    let command = new GetObjectCommand(getObjParams);
    let url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const user = {
      userId: userdetails.user_id,
      email: userdetails.email,
      username: userdetails.username,
      profile_pic_url: url,
    };
    const token = jwt.sign(user, secretKey, { expiresIn: "1h" });

    res.cookie("token", token);
  } catch (err) {
    console.error(`Error while comparing `, err.message);
  }
  res.render("profile", { user: req.user, message: "Updated" });
};

module.exports = {
  getDashboard,
  getFavouritePost,
  addtFavouritePost,
  deleteFavouritePost,
  getProfile,
  editProfile,
};
