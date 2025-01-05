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

router.route("/").get(authenticateToken, async (req, res) => {
  res.render("dashboard", { user: req.user });
});

router
  .route("/favourite-post")
  .get(authenticateToken, async (req, res) => {
    try {
      let sql = `
      SELECT 
  Post.post_id, 
  Post.title, 
  Post.image_url, 
  Post.description, 
  Post.location, 
  Post.like_count,
  Post.created_at AS post_created_at, 
  User.user_id, 
  User.username, 
  User.email, 
  User.profile_pic_url,
  User.gender, 
  User.first_name, 
  User.last_name, 
  User.dob, 
  User.age, 
  User.created_at AS user_created_at,
  CASE 
    WHEN user_likes_post.user_id IS NOT NULL THEN 1 
    ELSE 0 
  END AS is_liked,
  CASE 
    WHEN user_favourites_post.user_id IS NOT NULL THEN 1 
    ELSE 0 
  END AS is_favourited
  FROM 
  Post
  JOIN 
  User 
  ON Post.user_id = User.user_id
  LEFT JOIN 
  user_likes_post 
  ON Post.post_id = user_likes_post.post_id AND user_likes_post.user_id = ?
  JOIN 
  user_favourites_post 
  ON Post.post_id = user_favourites_post.post_id AND user_favourites_post.user_id = ?;`;
      db.query(sql, [req.user.userId, req.user.userId]).then(
        async (results) => {
          // console.log(results);
          for (let p of results) {
            let getObjParams = {
              Bucket: bucketName,
              Key: p.image_url,
            };
            let command = new GetObjectCommand(getObjParams);
            let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            p.imageURL = url;
          }
          // console.log(results);

          res.render("favourite", { user: req.user, posts: results });
        }
      );

      // res.json({ message: "Data received successfully" });
    } catch (error) {
      console.log(error);
    }
  })
  .post(async (req, res) => {
    let token = req.cookies.token;
    let userIdFvtPost = "";
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
      userIdFvtPost = req.user.userId;
    });

    console.log(req.user, "from fav post");
    // console.log(req.cookies.token);
    if (token) {
      try {
        let sql =
          "INSERT IGNORE INTO user_favourites_post ( user_id, post_id ) VALUES (?,?)";
        const user_post_fvt = await db.query(sql, [
          userIdFvtPost,
          req.body.postId,
        ]);

        if (user_post_fvt.affectedRows === 0) {
          let sql =
            "DELETE FROM user_favourites_post WHERE user_id = ? AND post_id = ?";
          const result = await db.query(sql, [userIdFvtPost, req.body.postId]);

          res.json({ message: "Data is already present", duplicate: true });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      res.json({ message: "User not logged in" });
    }

    // res.render("profile", { user: req.user });
  })
  .delete(authenticateToken, async (req, res) => {
    try {
      let sql =
        "DELETE FROM user_favourites_post WHERE user_id = ? AND post_id = ?";
      const result = await db.query(sql, [req.user.userId, req.body.postId]);

      res.json({ message: "Data is already present", status: true });

      // return res.redirect("/dashboard/favourite-post");
      // res.json({ message: "Data is already present", duplicate: true });
    } catch (error) {
      res.json({ message: "Something went wrong,try again" });
    }
  });

router
  .route("/create-post")
  .get(authenticateToken, async function (req, res) {
    var sql = `SELECT * 
     FROM Category`;
    const result = await db.query(sql);

    res.render("upload-image", { options: result, user: req.user });
  })
  .post(upload.single("image"), authenticateToken, async function (req, res) {
    // console.log(req.body);
    // console.log(req.file);
    // console.log(req.file.buffer);

    // console.log(req.body);

    console.log("create post");
    try {
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
      var sql = "SELECT * FROM CATEGORY WHERE category_name = ?";
      const categoryResult = await db.query(sql, [req.body.category]);
      console.log(categoryResult, "category result");

      // if category already exist
      if (categoryResult.length > 0) {
        // add post data in db
        var sql =
          "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
        const result = await db.query(sql, [
          req.user.userId,
          req.body.title,
          req.body.description,
          req.body.location,
          imageKey,
        ]);

        // link post with category
        var sql =
          "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
        const post_category_result = await db.query(sql, [
          result.insertId,
          categoryResult[0].category_id,
        ]);

        // if it is a new category
      } else {
        var sql = "INSERT INTO Category (category_name) VALUES (?)";
        const category_result = await db.query(sql, [req.body.category]);

        // add post data in db
        var sql =
          "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
        const post_result = await db.query(sql, [
          req.user.userId,
          req.body.title,
          req.body.description,
          req.body.location,
          "imageKey",
        ]);

        // link category
        var sql =
          "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
        const post_category_result = await db.query(sql, [
          post_result.insertId,
          category_result.insertId,
        ]);
      }

      // query latest category list, and return in frontend
      var sql = `SELECT * 
    FROM Category`;
      const result = await db.query(sql);

      res.json({
        user: req.user,
        options: result,
        status: true,
      });
    } catch (error) {
      res.json({
        user: req.user,
        status: false,
      });

      // res.render("upload-image", { user: req.user, status: false });
    }
  });

router
  .route("/profile")
  .get(authenticateToken, (req, res) => {
    res.render("profile", { user: req.user });
  })
  .post(authenticateToken, upload.single("image"), async (req, res) => {
    console.log(req.body);
    console.log(req.file);
    let user = new User(req.user.email);

    const imageKey = randomImageName();
    if (req.file) {
      console.log("file exist");
      const params = {
        Bucket: bucketName,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      // save image to s3 bucket
      const command = new PutObjectCommand(params);
      await s3.send(command);

      let userProfilePicupdated = await user.updateUserProfilePic(
        req.user.email,
        imageKey
      );
    }

    if (req.user.username !== req.body.username) {
      let userUsernameupdated = await user.updateUserUsername(
        req.user.email,
        req.body.username
      );
    }

    if (req.body.password !== "") {
      let userPasswordupdated = await user.updateUserPassword(
        req.user.email,
        req.body.password
      );
    }

    // create new token
    let userModel = new User(req.user.email);

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

      // Set the cookie with the token
      // res.cookie("token", token, { httpOnly: true });
      res.cookie("token", token);
    } catch (err) {
      console.error(`Error while comparing `, err.message);
    }
    // res.render("profile", { user: req.user, error: "Updated" });
    res.render("profile", { user: req.user, message: "Updated" });

    // return res.status(200).json({ message: "Profile updated successfully" });

    // res.render("profile", { user: req.user, error: "Updated" });
  });

router.route("/like-post").post(async (req, res) => {
  let token = req.cookies.token;
  let userIdFvtPost = "";
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.redirect("/login"); // Invalid token -> go to login
    }

    //    user {
    //   username: 'v1',
    //   profile_pic: '/image/samImg.jpg',
    //   iat: 1735589537,
    //    exp: 1735593137
    //  }
    req.user = user; // Attach user data to request
    userIdFvtPost = req.user.userId;
  });

  // console.log(req.cookies.token);
  if (token) {
    try {
      // IGNORE will not throw error, we can read response from daatabase
      let sql =
        "INSERT IGNORE INTO user_likes_post ( user_id, post_id ) VALUES (?,?)";
      const post_category_result = await db.query(sql, [
        userIdFvtPost,
        req.body.postId,
      ]);

      console.log(post_category_result);
      // if post already liked
      let like_count_result = "";
      if (post_category_result.affectedRows === 0) {
        // remove like and user ids from table
        let sql =
          "DELETE FROM user_likes_post WHERE user_id = ? AND post_id = ?";
        const result = await db.query(sql, [userIdFvtPost, req.body.postId]);

        let like_count_sql = `SELECT like_count FROM post WHERE post_id = ?`;
        like_count_result = await db.query(like_count_sql, [req.body.postId]);

        if (like_count_result[0].like_count > 0) {
          // dcrement like count
          let sqlPostLikeDecrement = `UPDATE post
            SET like_count = like_count - ${1}
            WHERE post_id = ?;`;
          const post_like_decrement = await db.query(sqlPostLikeDecrement, [
            req.body.postId,
          ]);
          console.log("decrement");

          let lastest_like_count = like_count_result[0].like_count - 1;

          res.json({
            message: "Data inserted successfully",
            likeCount: lastest_like_count,
          });
        } else {
          let sqlPostLikeDecrement = `UPDATE post
            SET like_count = ${0}
            WHERE post_id = ?;`;
          const post_like_decrement = await db.query(sqlPostLikeDecrement, [
            req.body.postId,
          ]);

          let lastest_like_count = 0;

          res.json({
            message: "Data inserted successfully",
            likeCount: lastest_like_count,
          });
        }

        console.log(like_count_result[0]);
      } else {
        console.log("eleeeeeeee");

        // if not liked before
        let sqlPostLikeIncrement = `UPDATE post
          SET like_count = like_count + ${1}
          WHERE post_id = ?;`;
        const like_count_afterIncrement_result = await db.query(
          sqlPostLikeIncrement,
          [req.body.postId]
        );

        let like_count_sql = `SELECT like_count FROM post WHERE post_id = ?`;
        like_count_result = await db.query(like_count_sql, [req.body.postId]);

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

  // res.render("profile", { user: req.user });
});

module.exports = router;
