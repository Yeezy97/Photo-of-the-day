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

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

dotenv.config();
// Create express app
var app = express();

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

app.get("/", async function (req, res) {
  sql =
    "SELECT Post.post_id,Post.title,Post.image_url,Post.description,Post.location,Post.created_at AS post_created_at,User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name, User.dob, User.age,User.created_at AS user_created_at FROM Post JOIN User ON Post.user_id = User.user_id";
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
    // console.log(results);
    res.render("home", { posts: results });
  });

  // res.render("home", { posts });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/dashboard/create-post", async function (req, res) {
  var sql = `SELECT * 
     FROM Category`;
  const result = await db.query(sql);
  console.log(result);

  res.render("upload-image", { options: result });
});

app.post(
  "/dashboard/create-post",
  upload.single("image"),
  async function (req, res) {
    console.log(req.body);
    console.log(req.file);
    console.log(req.file.buffer);

    console.log(req.body);

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

    var sql = "SELECT * FROM CATEGORY WHERE category_name = ?";
    const categoryResult = await db.query(sql, [req.body.category]);
    console.log(categoryResult, "category result");

    if (categoryResult.length > 0) {
      var sql =
        "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
      const result = await db.query(sql, [
        2,
        req.body.title,
        req.body.description,
        req.body.location,
        imageKey,
      ]);

      console.log(
        result.insertId,
        categoryResult[0].category_id,
        "------------"
      );

      var sql =
        "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
      const post_category_result = await db.query(sql, [
        result.insertId,
        categoryResult[0].category_id,
      ]);

      // console.log(result);
    } else {
      console.log("new category");
      var sql = "INSERT INTO Category (category_name) VALUES (?)";
      const category_result = await db.query(sql, [req.body.category]);

      var sql =
        "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
      const post_result = await db.query(sql, [
        2,
        req.body.title,
        req.body.description,
        req.body.location,
        "imageKey",
      ]);

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

    var sql = `SELECT * 
    FROM Category`;
    const result = await db.query(sql);
    console.log(result);

    res.render("upload-image", { options: result });

    // res.send({ sometext: "done" });

    // res.render("posts", { posts });
  }
);

app.get("/post", function (req, res) {
  sql = "select * from post";
  db.query(sql).then((results) => {
    console.log(results);
  });
  // res.render("posts", { posts });
});

app.get("/signup", function (req, res) {
  res.render("signup");
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

app.get("/dashboard", function (req, res) {
  res.render("dashboard");
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
