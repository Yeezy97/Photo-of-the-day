// Import express.js
const express = require("express");
const path = require("path");

const dotenv = require("dotenv");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const dashboardRouter = require("./routes/dashboardRoutes");
const homepageRouter = require("./routes/homepageRoutes");
const authRouter = require("./routes/authRoutes");

const cron = require("node-cron");

dotenv.config();

// Create express app
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json()); // json data to req.body
app.use(bodyParser.json());
app.use(cookieParser());

// Add static files location
app.use(express.static("public"));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "./views/pages"));

app.use(express.static("public"));

// Get the functions in the db.js file to use
const db = require("./services/db");

app.use("/", homepageRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
