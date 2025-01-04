// Import express.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const crypto = require("crypto");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { User } = require("./models/Users");

const secretKey = "your-secret-key";
dotenv.config();
// Create express app
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json()); // json data to req.body
app.use(bodyParser.json());
app.use(cookieParser());

// Add static files location
app.use(express.static("public"));

// Multer settings
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views/pages"));

// app.set("views", "../static");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

function generateLongRandomNumberArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

console.log(app.get("views"), "----------------loggg");
// Get the functions in the db.js file to use
const db = require("./services/db");

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login"); // No token -> go to login
  }

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
    console.log(req.user, "from auth middleware");

    next();
  });
};

const logout = (req, res) => {
  // set a cookie name = jwt, payload = loggedout, exprity = 10sec
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// app.get("/", async function (req, res) {
//   let sql = "";
//   sql =
//     "SELECT Post.post_id,Post.title,Post.image_url,Post.description,Post.location,Post.like_count,Post.created_at AS post_created_at,User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name, User.dob, User.age,User.created_at AS user_created_at FROM Post JOIN User ON Post.user_id = User.user_id";
//   db.query(sql).then(async (results) => {
//     // console.log(results);
//     for (let p of results) {
//       let getObjParams = {
//         Bucket: bucketName,
//         Key: p.image_url,
//       };
//       let command = new GetObjectCommand(getObjParams);
//       let url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//       p.imageURL = url;
//     }
//     // console.log(results);
//     res.render("home", { posts: results });
//   });
// });

app.get("/", async function (req, res) {
  let token = req?.cookies?.token;
  if (token) {
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.redirect("/login"); // Invalid token -> go to login
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
            p.imageURL = url;
          }
          // console.log(results);
          console.log(results[0].like_count === 0, "likecountttttttt");

          res.render("home", { posts: results });
        }
      );

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
        }

        res.render("home", { posts: results });

        // console.log(results);
      });
    } catch (error) {}

    // res.render("home", { posts: r });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/login", function (req, res) {
  res.render("login");
});

// Check submitted email and password pair
// app.post("/authenticate", async function (req, res) {
//   params = req.body;
//   var user = new User(params.email);
//   try {
//     uId = await user.getIdFromEmail();
//     if (uId) {
//       match = await user.authenticate(params.password);
//       if (match) {
//         req.session.uid = uId;
//         req.session.loggedIn = true;
//         console.log(req.session.id);
//         res.redirect("/student-single/" + uId);
//       } else {
//         // TODO improve the user journey here
//         res.send("invalid password");
//       }
//     } else {
//       res.send("invalid email");
//     }
//   } catch (err) {
//     console.error(`Error while comparing `, err.message);
//   }
// });

app.post("/login", async (req, res) => {
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

app.get("/dashboard", authenticateToken, async (req, res) => {
  // let user = new User();
  // let userInfo = await user.getUserDetails(req.user.email);
  // console.log(userInfo);

  // if (userInfo) {
  //   let getObjParams = {
  //     Bucket: bucketName,
  //     Key: userInfo.profile_pic_url,
  //   };
  //   let command = new GetObjectCommand(getObjParams);
  //   let url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  //   const userdata = {
  //     userId: userInfo.user_id,
  //     email: userInfo.email,
  //     username: userInfo.username,
  //     profile_pic_url: url,
  //   };

  //   res.render("dashboard", { user: req.user });
  // } else {
  //   res.render("dashboard");
  // }

  res.render("dashboard", { user: req.user });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// app.get("/dashboard", function (req, res) {
//   res.render("dashboard");
// });

app.get("/dashboard/create-post", authenticateToken, async function (req, res) {
  var sql = `SELECT * 
     FROM Category`;
  const result = await db.query(sql);
  console.log(result);

  res.render("upload-image", { options: result, user: req.user });
});

app.post(
  "/dashboard/create-post",
  upload.single("image"),
  authenticateToken,
  async function (req, res) {
    // console.log(req.body);
    // console.log(req.file);
    // console.log(req.file.buffer);

    // console.log(req.body);

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

    // var sql =
    //   "INSERT INTO Post (post_id ,user_id, title, location, description, image_url ) VALUES (?, ? , ? , ? ,? , ?)";
    // const result = await db.query(sql, [
    //   11,
    //   1,
    //   req.body.title,
    //   req.body.location,
    //   req.body.description,
    //   imageKey,
    // ]);

    const longRandomNumberArray = generateLongRandomNumberArray(5);

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
        2,
        req.body.title,
        req.body.description,
        req.body.location,
        imageKey,
      ]);

      // console.log(
      //   result.insertId,
      //   categoryResult[0].category_id,
      //   "------------"
      // );

      // link post with category
      var sql =
        "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
      const post_category_result = await db.query(sql, [
        result.insertId,
        categoryResult[0].category_id,
      ]);

      // if it is a new category
    } else {
      // console.log("new category");
      // create new category
      var sql = "INSERT INTO Category (category_name) VALUES (?)";
      const category_result = await db.query(sql, [req.body.category]);

      // add post data in db
      var sql =
        "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
      const post_result = await db.query(sql, [
        2,
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

    // var sql =
    //   "INSERT INTO Post (post_id, user_id, title, description, location, image_url ) VALUES (?,?,?,?,?,?)";
    // const result = await db.query(sql, [
    //   2,
    //   req.body.title,
    //   req.body.description,
    //   req.body.location,
    //   imageKey,
    // ]);

    // query latest category list, and return in frontend
    var sql = `SELECT * 
    FROM Category`;
    const result = await db.query(sql);
    console.log(result);

    res.render("upload-image", { user: req.user, options: result });

    // res.send({ sometext: "done" });

    // res.render("posts", { posts });
  }
);

app.get("/dashboard/favourite-post", authenticateToken, async (req, res) => {
  console.log(req.user, "from favourite");
  let userId = req.user.userId;
  let sql = `Select * FROM user_favourites_post
     JOIN post ON post.post_id = user_favourites_post.post_id
      WHERE user_favourites_post.user_id = ? `;
  db.query(sql, [userId]).then(async (results) => {
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
  });
});

app.post("/dashboard/favourite-post", async (req, res) => {
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

  console.log(req.user, "from fav post");
  // console.log(req.cookies.token);
  if (token) {
    try {
      var sql =
        "INSERT INTO user_favourites_post ( user_id, post_id ) VALUES (?,?)";
      const post_category_result = await db.query(sql, [
        userIdFvtPost,
        req.body.postId,
      ]);

      console.log(post_category_result[0]);

      res.json({ message: "Data received successfully" });
    } catch (error) {
      console.log(error);
    }
  } else {
    res.json({ message: "User not logged in" });
  }

  // res.render("profile", { user: req.user });
});

app.post("/dashboard/like-post", async (req, res) => {
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
      if (post_category_result.affectedRows === 0) {
        // remove like and user ids from table
        let sql =
          "DELETE FROM user_likes_post WHERE user_id = ? AND post_id = ?";
        const result = await db.query(sql, [userIdFvtPost, req.body.postId]);

        let like_count_sql = `SELECT like_count FROM post WHERE post_id = ?`;
        const like_count_result = await db.query(like_count_sql, [
          req.body.postId,
        ]);
        console.log(like_count_result[0], "like count");
        console.log(like_count_result[0].like_count > 0, "like count");

        if (like_count_result[0].like_count > 0) {
          // dcrement like count
          let sqlPostLikeDecrement = `UPDATE post
          SET like_count = like_count - ${1}
          WHERE post_id = ?;`;
          const post_like_decrement = await db.query(sqlPostLikeDecrement, [
            req.body.postId,
          ]);
          console.log("decrement");
          res.json({ message: "Data is already present", duplicate: true });
        } else {
          let sqlPostLikeDecrement = `UPDATE post
          SET like_count = ${0}
          WHERE post_id = ?;`;
          const post_like_decrement = await db.query(sqlPostLikeDecrement, [
            req.body.postId,
          ]);
          console.log("like set to 0");
          res.json({ message: "Data is already present", duplicate: true });
        }
      } else {
        console.log("eleeeeeeee");

        // // if not liked before
        let sqlPostLikeIncrement = `UPDATE post
        SET like_count = like_count + ${1}
        WHERE post_id = ?;`;
        const post_like_increment = await db.query(sqlPostLikeIncrement, [
          req.body.postId,
        ]);

        res.json({ message: "Data inserted successfully", duplicate: false });
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.json({ message: "User not logged in" });
  }

  // res.render("profile", { user: req.user });
});

app.get("/dashboard/profile", authenticateToken, (req, res) => {
  res.render("profile", { user: req.user });
});

app.post(
  "/dashboard/profile",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
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
    res.render("profile", { user: req.user, error: "Updated" });

    // return res.status(200).json({ error: "Profile updated successfully" });

    // res.render("profile", { user: req.user, error: "Updated" });
  }
);

app.get("/post", function (req, res) {
  // sql = "select * from post";
  // db.query(sql).then((results) => {
  //   console.log(results);
  // });
  // res.render("posts", { posts });
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signup", async function (req, res) {
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
    res.redirect("/login");
  } else {
    res.render("signup", { message: "Something went wrong try again" });
  }
});

app.get("/category", function (req, res) {
  res.render("category");
});

app.get("/category/:id", function (req, res) {
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

// Check submitted email and password pair
app.post("/authenticate", async function (req, res) {
  params = req.body;
  var user = new User(params.email);
  try {
    uId = await user.getIdFromEmail();
    if (uId) {
      match = await user.authenticate(params.password);
      if (match) {
        req.session.uid = uId;
        req.session.loggedIn = true;
        console.log(req.session.id);
        res.redirect("/student-single/" + uId);
      } else {
        // TODO improve the user journey here
        res.send("invalid password");
      }
    } else {
      res.send("invalid email");
    }
  } catch (err) {
    console.error(`Error while comparing `, err.message);
  }
});

// ------------------ upload image --------------------
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage });

// // Routes
// app.get("/upload", (req, res) => {
//   res.render("upload");
// });

// app.post("/upload", upload.single("image"), (req, res) => {
//   const { title, description, location } = req.body;
//   const imagePath = `/uploads/${req.file.filename}`;

//   console.log("Uploaded Image Details:");
//   console.log({ title, description, location, imagePath });

//   res.send(`<h1>Image Uploaded Successfully!</h1>
//             <p>Title: ${title}</p>
//             <p>Description: ${description}</p>
//             <p>Location: ${location}</p>
//             <img src="${imagePath}" alt="${title}" style="max-width: 100%;">`);
// });

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
