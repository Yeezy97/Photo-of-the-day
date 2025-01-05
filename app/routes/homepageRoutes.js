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

router.route("/").get(async function (req, res) {
  let token = req?.cookies?.token;
  if (token) {
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.redirect("/auth/login"); // Invalid token -> go to login
      }

      //    user {
      //  userId: 1,
      //   username: 'v1',
      //   profile_pic: '/image/samImg.jpg',
      //   iat: 1735589537,
      //    exp: 1735593137
      //  }
      req.user = user; // Attach user data to request
    });
  }

  let sql = "";

  // console.log(req.cookies.token);
  if (token) {
    try {
      //     sql = `
      // SELECT Post.post_id, Post.title, Post.image_url, Post.description, Post.location, Post.like_count,
      // Post.created_at AS post_created_at, User.user_id, User.username, User.email, User.profile_pic_url,
      // User.gender, User.first_name, User.last_name, User.dob, User.age, User.created_at AS user_created_at,
      // CASE WHEN user_likes_post.user_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked
      // FROM Post
      // JOIN User ON Post.user_id = User.user_id
      // LEFT JOIN user_likes_post
      //   ON Post.post_id = user_likes_post.post_id AND user_likes_post.user_id = ?`;

      sql = `
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
  LEFT JOIN 
    user_favourites_post 
    ON Post.post_id = user_favourites_post.post_id AND user_favourites_post.user_id = ?;`;
      db.query(sql, [req.user.userId, req.user.userId]).then(
        async (results) => {
          console.log(results[0], "from post with token");

          // console.log(results);
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
            console.log(p.profile_pic_url);

            let commanduser = new GetObjectCommand(getUserPicParams);
            let profileURL = await getSignedUrl(s3, commanduser, {
              expiresIn: 3600,
            });
            p.profileIMG = profileURL;

            p.imageURL = url;
          }

          res.render("home", { posts: results, user: req.user });
        }
      );

      // db.query(sql, [req.user.userId, req.user.userId]).then(
      //   async (results) => {
      //     await Promise.all(
      //       results.map(async (item) => {
      //         let getObjParams = {
      //           Bucket: bucketName,
      //           Key: item.image_url,
      //         };
      //         let command = new GetObjectCommand(getObjParams);
      //         let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      //         item.imageURL = url;

      //         // user profile pic
      //         let getUserPicParams = {
      //           Bucket: bucketName,
      //           Key: item.profile_pic_url,
      //         };

      //         let commanduser = new GetObjectCommand(getUserPicParams);
      //         let profileURL = await getSignedUrl(s3, commanduser, {
      //           expiresIn: 3600,
      //         });
      //         item.profileIMG = profileURL;
      //       })
      //     );
      //   }
      // );

      // res.render("home", { posts: results, user: req.user });

      // res.json({ message: "Data received successfully" });
    } catch (error) {
      console.log(error);
    }
  } else {
    sql =
      "SELECT Post.post_id,Post.title,Post.image_url,Post.description,Post.location,Post.like_count,Post.created_at AS post_created_at,User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name, User.dob, User.age,User.created_at AS user_created_at FROM Post JOIN User ON Post.user_id = User.user_id";
    try {
      db.query(sql).then(async (results) => {
        // console.log(results);
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

        // console.log(results);
      });
    } catch (error) {}

    // res.render("home", { posts: r });
  }
});

router.route("/category").get(function (req, res) {
  res.render("category");
});

router.route("/category/:id").get(function (req, res) {
  console.log(req.params.id);
  let category_name = req.params.id;
  let dateinfo = new Date();
  let monthName = dateinfo.toLocaleString("default", { month: "long" });
  let date = dateinfo.getDate();
  let year = dateinfo.getFullYear();
  // console.log(date, monthName, year);

  sql = `SELECT 
      Post.post_id,
      Post.title,
      Post.image_url,
      Post.description,
      Post.location,
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
      User.created_at AS user_created_at 
  FROM 
      Post 
  JOIN 
      User ON Post.user_id = User.user_id
  JOIN 
      Post_Category ON Post.post_id = Post_Category.post_id
  JOIN 
      Category ON Post_Category.category_id = Category.category_id 
  WHERE 
      Category.category_name = ?`;
  db.query(sql, [category_name]).then(async (results) => {
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

    // set todays date
    if (category_name === "today")
      category_name += ` - ${date}, ${monthName} ${year}`;
    // console.log(results);
    res.render("categorized-page", {
      posts: results,
      category_title: category_name,
    });
  });

  // res.render(".categorized-page");
});

router.route("/about").get(function (req, res) {
  res.render("about");
});

module.exports = router;
