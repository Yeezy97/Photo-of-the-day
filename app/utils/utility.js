const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const secretKey = process.env.TOKEN_SECRET_KEY;

// check if token is valid, else logout user
const verifyTokenExist = (req, res) => {
  let token = req.cookies.token;

  if (token) {
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        // if token invalid then logout
        res.redirect("/auth/logout");
      }

      // Attach user data to request
      req.user = user;
    });
  }
};

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/auth/login"); // No token -> go to login
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.redirect("/auth/login"); // Invalid token -> go to login
    }

    req.user = user; // Attach user data to request
    next();
  });
};

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

module.exports = { verifyTokenExist, authenticateToken, randomImageName };
