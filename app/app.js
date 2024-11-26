// Import express.js
const express = require("express");
const path = require("path");

// Create express app
var app = express();

// Add static files location
app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views/pages"));

// app.set("views", "../static");

console.log(app.get("views"), "----------------loggg");
// Get the functions in the db.js file to use
const db = require("./services/db");

app.get("/", function (req, res) {
  // sql = "select * from post";
  sql =
    "SELECT Post.post_id,Post.title,Post.image_url,Post.description,Post.location,Post.created_at AS post_created_at,User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name, User.dob, User.age,User.created_at AS user_created_at FROM Post JOIN User ON Post.user_id = User.user_id";
  db.query(sql).then((results) => {
    console.log(results);
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

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
