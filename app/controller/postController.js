// library imports
const dotenv = require("dotenv");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// internal imports
const { Post } = require("../models/Posts");
const { verifyTokenExist, randomImageName } = require("../utils/utility");

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.BUCKET_ACCESS_KEY;
const secretAccessKey = process.env.BUCKET_SECRET_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const getAllPost = async (req, res) => {
  let token = req.cookies.token;

  // check if token valid, otherwise logout user
  verifyTokenExist(req, res);

  const postModel = new Post();

  // console.log(req.cookies.token);
  if (token) {
    try {
      const results = await postModel.queryPostWithToken(req, res);

      for (let p of results) {
        let getObjParams = {
          Bucket: bucketName,
          Key: p.image_url,
        };
        let command = new GetObjectCommand(getObjParams);
        let url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        let getUserPicParams = {
          Bucket: bucketName,
          Key: p.profile_pic_url,
        };

        let commanduser = new GetObjectCommand(getUserPicParams);
        let profileURL = await getSignedUrl(s3, commanduser, {
          expiresIn: 3600,
        });

        p.profileIMG = profileURL;
        p.imageURL = url;
      }

      res.render("home", { posts: results, user: req.user });
    } catch (s3Error) {
      console.error("Error fetching S3 URL:", s3Error);
    }
  } else {
    try {
      let results = await postModel.queryAllPost(req, res);

      for (let p of results) {
        let getObjParams = {
          Bucket: bucketName,
          Key: p.image_url,
        };
        let command = new GetObjectCommand(getObjParams);
        let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        p.imageURL = url;
        let getUserPicParams = {
          Bucket: bucketName,
          Key: p.profile_pic_url,
        };
        let commanduser = new GetObjectCommand(getUserPicParams);
        let profileURL = await getSignedUrl(s3, commanduser, {
          expiresIn: 3600,
        });
        p.profileIMG = profileURL;
      }

      res.render("home", { posts: results });
    } catch (s3Error) {
      console.error("Error fetching S3 URL:", s3Error);
    }
  }
};

const getAbout = (req, res) => {
  verifyTokenExist(req, res);

  res.render("about", { user: req.user });
};

const getCategory = (req, res) => {
  verifyTokenExist(req, res);

  res.render("category", { user: req.user });
};

const getCategoryById = async (req, res) => {
  let category_name = req.params.id;
  let dateinfo = new Date();
  let monthName = dateinfo.toLocaleString("default", { month: "long" });
  let date = dateinfo.getDate();
  let year = dateinfo.getFullYear();

  verifyTokenExist(req, res);

  const postModel = new Post();

  try {
    const results = await postModel.queryCategoryById(category_name);

    for (let p of results) {
      let getObjParams = {
        Bucket: bucketName,
        Key: p.image_url,
      };
      let command = new GetObjectCommand(getObjParams);
      let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      p.imageURL = url;
    }

    // set todays date
    if (category_name === "today") {
      category_name += ` - ${date}, ${monthName} ${year}`;
    }
    res.render("categorized-page", {
      posts: results,
      category_title: category_name,
      user: req.user,
    });
  } catch (s3Error) {
    console.error("Error fetching S3 URL:", s3Error);
  }
};

const likepost = async (req, res) => {
  let token = req.cookies.token;
  verifyTokenExist(req, res);
  let userIdFvtPost = req.user.userId;

  const postModel = new Post();

  if (token) {
    try {
      let like_post_result = await postModel.queryLikePost(
        req,
        res,
        userIdFvtPost
      );
      // if post already liked
      let like_count_result = "";
      if (like_post_result.affectedRows === 0) {
        // remove like and user ids from table

        let delete_like_result = await postModel.queryDeletePostLike(
          req,
          res,
          userIdFvtPost
        );
        let like_count_result = await postModel.queryPostLikeCount(req, res);

        //if post already liked, then remove like
        if (like_count_result[0].like_count > 0) {
          let decrement_result = await postModel.decrementPostLike(req, res);

          // let lastest_like_count = like_count_result[0].like_count - 1;
          let like_count_result = await postModel.queryPostLikeCount(req, res);

          res.json({
            message: "Data inserted successfully",
            likeCount: like_count_result[0].like_count,
          });
        } else {
          let post_result = await postModel.setLikeCountDefault(req, res);

          let lastest_like_count = 0;
          let like_count_result = await postModel.queryPostLikeCount(req, res);

          res.json({
            message: "Data inserted successfully",
            likeCount: like_count_result[0].like_count,
          });
        }
      } else {
        // increment post like by 1

        let like_increment_result = await postModel.queryPostLikeIncrement(
          req,
          res
        );

        let like_count_result = await postModel.queryPostLikeCount(req, res);

        let lastest_like_count = like_count_result[0].like_count;

        res.json({
          message: "Data inserted successfully",
          likeCount: lastest_like_count,
        });
      }
    } catch (error) {
      res.json({ message: "Data not inserted successfully", success: false });

      console.log(error);
    }
  } else {
    res.json({ message: "User not logged in" });
  }
};

const getCreatePost = async function (req, res) {
  let postModel = new Post();
  try {
    let category_result = await postModel.getAllCategory(req, res);
    res.render("upload-image", { options: category_result, user: req.user });
  } catch (error) {
    console.error("Error fetching, try again", error);
  }
};

const createPost = async function (req, res) {
  let postModel = new Post();
  try {
    if (
      req.user.userId &&
      req.body.title &&
      req.body.description &&
      req.body.location &&
      req.file
    ) {
      const imageKey = randomImageName();
      const params = {
        Bucket: bucketName,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      // save image to s3 bucket
      const command = new PutObjectCommand(params);
      await s3.send(command);

      // query all categories from db
      let categoryResult = await postModel.queryCategoryByName(req, res);

      // if category already exist
      if (categoryResult.length > 0) {
        // add post data in db

        let addPost_result = await postModel.queryAddPost(
          req,
          res,
          imageKey,
          categoryResult
        );

        // if it is a new category
      } else {
        let addPostWithCategory_result =
          await postModel.queryAddPostWithCategory(req, res);
      }

      // query latest category list, and return in frontend
      let category_result = await postModel.getAllCategory(req, res);

      res.json({
        user: req.user,
        options: category_result,
        status: true,
      });
    } else {
      res.json({
        user: req.user,
        status: false,
      });
    }
  } catch (error) {
    res.json({
      user: req.user,
      status: false,
    });
  }
};

module.exports = {
  getAllPost,
  getCategoryById,
  getCategory,
  getAbout,
  likepost,
  getCreatePost,
  createPost,
};
