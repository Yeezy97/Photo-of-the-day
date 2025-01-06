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

const dashboardRouter = require("./routes/dashboardRoutes");
const homepageRouter = require("./routes/homepageRoutes");
const authRouter = require("./routes/authRoutes");
const { User } = require("./models/Users");

const cron = require("node-cron");

dotenv.config();

// Create express app
const app = express();

const secretKey = process.env.TOKEN_SECRET_KEY;

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

app.use(express.static("public"));
console.log("Serving static files from:", path.join(__dirname, "public"));

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// console.log(app.get("views"), "----------------loggg");
function generateLongRandomNumberArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

// Schedule the task to run at midnight every day
// cron.schedule("* * * * *", async () => {
//   console.log("Task executed at:", new Date());
//   try {
//     let podSQL = `SELECT
//     post_id,
//     like_count
// FROM
//     post
// WHERE
//     created_at BETWEEN NOW() - INTERVAL 3 MINUTE AND NOW() - INTERVAL 1 MINUTE
// ORDER BY
//     like_count DESC;`;
//     const podResult = await db.query(podSQL);

//     console.log(podResult[0]);

//     // res.json({
//     //   message: "Data inserted successfully",
//     //   likeCount: lastest_like_count,
//     // });
//   } catch (error) {}
// });

console.log(app.get("views"), "----------------loggg");
// Get the functions in the db.js file to use
const db = require("./services/db");

app.use("/", homepageRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
// Get the functions in the db.js file to use

async function selectPhotoOfTheDay() {
  try {
    // Check if there's already a Photo of the Day selected in the last 24 hours
    const existingPhotoQuery = `
      SELECT * FROM Post
      WHERE selected_as_photo_of_the_day = 1
      ORDER BY selectedAsPod_at DESC
      LIMIT 1
    `;
    const existingPhoto = await db.query(existingPhotoQuery);

    // If there's an existing "Photo of the Day" and it was selected in the last 24 hours, do not select a new one
    if (existingPhoto.length > 0) {
      const existingPhotoDate = new Date(existingPhoto[0].selectedAsPod_at);
      const now = new Date();
      const timeDifference = now - existingPhotoDate;

      // If the selected photo is less than 24 hours old, skip the new selection
      if (timeDifference < 24 * 60 * 60 * 1000) {
        console.log(
          "Photo of the Day is already selected within the last 24 hours. Skipping selection."
        );
        return;
      }
    }

    // Proceed to select the new photo based on likes from the last 2 minutes
    const now = new Date();
    const last2Minutes = new Date(now.getTime() - 2 * 60 * 1000); // Get the timestamp for 2 minutes ago
    const mysqlFormattedDate = now.toISOString().slice(0, 19).replace("T", " ");
    // const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // const photoQuery = `
    //   SELECT Post.post_id, Post.title, Post.image_url, Post.description, COUNT(User_Likes_Post.post_id) AS like_count
    //   FROM Post
    //   LEFT JOIN User_Likes_Post ON Post.post_id = User_Likes_Post.post_id1
    //   WHERE Post.created_at >= ? AND Post.created_at <= ?
    //   AND Post.selected_as_photo_of_the_day = 0 -- Only consider posts not already selected
    //   GROUP BY Post.post_id
    //   ORDER BY like_count DESC
    //   LIMIT 1
    // `;
    const photoQuery = `
      SELECT Post.post_id, Post.title, Post.image_url, Post.description, Post.like_count
      FROM Post
      WHERE Post.created_at >= ? AND Post.created_at <= ?
      AND Post.selected_as_photo_of_the_day = 0 -- Only consider posts not already selected
      ORDER BY Post.like_count DESC
      LIMIT 1
    `;

    const result = await db.query(photoQuery, [
      last2Minutes.toISOString(),
      now.toISOString(),
    ]);

    if (result.length === 0) {
      console.log("No eligible photos found for Photo of the Day.");
      return; // No eligible photo
    }

    const selectedPhoto = result[0];

    // Mark the selected post as Photo of the Day
    const updatePhotoQuery = `
      UPDATE Post
      SET selected_as_photo_of_the_day = 1, selectedAsPod_at = ?
      WHERE post_id = ?
    `;
    await db.query(updatePhotoQuery, [
      mysqlFormattedDate,
      selectedPhoto.post_id,
    ]);

    console.log("Photo of the Day selected:", selectedPhoto);
  } catch (error) {
    console.error("Error selecting Photo of the Day:", error);
  }
}

async function getPhotoOfTheDay() {
  // Query the PhotoOfTheDay table for the most recent selection
  const PODquery = `
      SELECT * FROM Post
      WHERE selected_as_photo_of_the_day = 1
      ORDER BY selectedAsPod_at DESC
      LIMIT 1
  `;

  const photoResults = await db.query(PODquery);
  return photoResults.length > 0 ? photoResults[0] : null;
}
// Home Route
app.get("/", async function (req, res) {
  try {
    await selectPhotoOfTheDay();
    // Fetch all posts
    const postsQuery = `
      SELECT Post.post_id, Post.title, Post.image_url, Post.description, Post.location, Post.created_at AS post_created_at,
             User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name,
             User.dob, User.age, User.created_at AS user_created_at
      FROM Post
      JOIN User ON Post.user_id = User.user_id
    `;
    const posts = await db.query(postsQuery);

    // Get Photo of the Day
    const photoOfTheDay = await getPhotoOfTheDay();

    // Render the home page with posts and Photo of the Day
    res.render("home", { posts, photoOfTheDay });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// About Route
app.get("/about", function (req, res) {
  res.render("about");
});

// Login Route
app.get("/login", function (req, res) {
  res.render("login");
});

// Post Route
app.get("/post", async function (req, res) {
  try {
    const postsQuery = "SELECT * FROM Post";
    const posts = await db.query(postsQuery);
    console.log(posts);
    res.render("posts", { posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Signup Route
app.get("/signup", function (req, res) {
  res.render("signup");
});

// // Cron job to select Photo of the Day every hour
// cron.schedule("*/5 * * * *", async () => {
//   try {
//     console.log("Checking for Photo of the Day...");
//     await selectPhotoOfTheDay(); // Ensure this function is properly defined and working
//     console.log("Photo of the Day selected successfully!");
//   } catch (error) {
//       console.error("Error selecting Photo of the Day:", error);
//   }
// });

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
