// Import express.js
const express = require("express");
const path = require("path");

// Create express app
var app = express();

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add static files location
app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views/pages"));

console.log(app.get("views"), "----------------loggg");
// Get the functions in the db.js file to use
const db = require("./services/db");

app.get("/", function (req, res) {
  const currentUserId = 1; // Replace with actual logic for logged-in user's ID
  const sql = `
    SELECT 
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
      User.created_at AS user_created_at,
      EXISTS (
        SELECT 1 
        FROM User_Likes_Post 
        WHERE User_Likes_Post.post_id = Post.post_id 
          AND User_Likes_Post.user_id = ?
      ) AS is_liked 
    FROM Post 
    JOIN User ON Post.user_id = User.user_id`;

  db.query(sql, [currentUserId]).then((results) => {
    res.render("home", { posts: results });
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/post", function (req, res) {
  sql = "select * from post";
  db.query(sql).then((results) => {
    console.log(results);
  });
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

// Route to handle likes
app.post("/like", function (req, res) {
  const { user_id, post_id } = req.body;

  const checkSql = "SELECT * FROM User_Likes_Post WHERE user_id = ? AND post_id = ?";
  db.query(checkSql, [user_id, post_id])
    .then((result) => {
      if (result.length > 0) {
        return res.status(400).send("You already liked this post.");
      } else {
        const insertSql = "INSERT INTO User_Likes_Post (user_id, post_id) VALUES (?, ?)";
        return db.query(insertSql, [user_id, post_id]).then(() => {
          const updateSql = "UPDATE Post SET total_likes = total_likes + 1 WHERE post_id = ?";
          return db.query(updateSql, [post_id]).then(() => {
            res.status(200).send("Like added successfully!");
          });
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("An error occurred.");
    });
});

// Route to get the most liked picture
app.get("/most-liked", function (req, res) {
  const sql = "SELECT * FROM Post ORDER BY total_likes DESC LIMIT 1";
  db.query(sql)
    .then((result) => {
      res.json(result[0]);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("An error occurred.");
    });
});

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});

