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

// app.get("/", function (req, res) {
//   res.render("test2");
// });

// Create a route for root - /
app.get("/", function (req, res) {
  res.send("Hello world!!!");
});

app.get("/home", function (req, res) {
  // const posts = [
  //   {
  //     postid: 1,
  //     title: "Post One",
  //     description: "This is the first post description.",
  //     image: "/images/post1.jpg",
  //   },
  //   {
  //     postid: 2,
  //     title: "Post Two",
  //     description: "This is the second post description.",
  //     image: "/images/post2.jpg",
  //   },
  // ];
  sql = "select * from posts";
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
  // const posts = [
  //   {
  //     postid: 1,
  //     title: "Post One",
  //     description: "This is the first post description.",
  //     image: "/images/post1.jpg",
  //   },
  //   {
  //     postid: 2,
  //     title: "Post Two",
  //     description: "This is the second post description.",
  //     image: "/images/post2.jpg",
  //   },
  // ];

  sql = "select * from posts";
  db.query(sql).then((results) => {
    console.log(results);
  });
  // res.render("posts", { posts });
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

// Create a route for testing the db
app.get("/db_test", function (req, res) {
  // Assumes a table called test_table exists in your database
  sql = "select * from test_table";
  db.query(sql).then((results) => {
    console.log(results);
    res.send(results);
  });
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function (req, res) {
  res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function (req, res) {
  // req.params contains any parameters in the request
  // We can examine it in the console for debugging purposes
  console.log(req.params);
  //  Retrieve the 'name' parameter and use it in a dynamically generated page
  res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
