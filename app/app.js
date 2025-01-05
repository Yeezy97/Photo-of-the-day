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

dotenv.config();

// Create express app
var app = express();

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

// app.set("views", "../static");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

function generateLongRandomNumberArray(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

console.log(app.get("views"), "----------------loggg");
// Get the functions in the db.js file to use
const db = require("./services/db");

app.use("/", homepageRouter);
app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);

// Start server on port 3000
app.listen(3000, function () {
  console.log(`Server running at http://127.0.0.1:3000/`);
});
