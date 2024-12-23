// Import express.js
const express = require("express");
const path = require("path");

// Create express app
const app = express();

// Add static files location
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views/pages"));

app.use(express.static("public"));
console.log("Serving static files from:", path.join(__dirname, "public"));

// Get the functions in the db.js file to use
const db = require("./services/db");

// function to get Photo of the Day
async function getPhotoOfTheDay() {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Get the timestamp for 24 hours ago

  // Convert both dates to ISO strings for easier comparison
  const nowISOString = now.toISOString();
  const last24HoursISOString = last24Hours.toISOString();

  const photoQuery = `
    SELECT Post.image_url, Post.title, Post.description, COUNT(User_Likes_Post.post_id) AS like_count
    FROM Post
    JOIN User_Likes_Post ON Post.post_id = User_Likes_Post.post_id
    WHERE User_Likes_Post.liked_at >= ?
    GROUP BY Post.post_id
    ORDER BY like_count DESC
    LIMIT 1
  `;

  const photoResults = await db.query(photoQuery, [last24HoursISOString]);
  return photoResults.length > 0 ? photoResults[0] : null;
}
// Home Route
app.get("/", async function (req, res) {
  try {
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

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});