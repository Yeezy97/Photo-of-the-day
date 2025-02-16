const db = require("../services/db");
const bcrypt = require("bcryptjs");

class User {
  // Id of the user
  id;

  // Email of the user
  email;

  constructor(email) {
    this.email = email;
  }

  // Get an existing user id from an email address, or return false if not found
  async getIdFromEmail() {
    var sql = "SELECT user_id FROM User WHERE email = ?";
    const result = await db.query(sql, [this.email]);
    // TODO LOTS OF ERROR CHECKS HERE..
    if (JSON.stringify(result) != "[]") {
      this.id = result[0].user_id;
      return this.id;
    } else {
      return false;
    }
  }

  async getUserDetails(email) {
    var sql = "SELECT * FROM User WHERE email = ?";
    const result = await db.query(sql, [email]);
    let user = "";
    // TODO LOTS OF ERROR CHECKS HERE..
    if (JSON.stringify(result) != "[]") {
      user = result[0];
      return user;
    } else {
      return false;
    }
  }

  // Add a password to an existing user
  async setUserPassword(password) {
    const pw = await bcrypt.hash(password, 10);
    var sql = "UPDATE User SET password = ? WHERE User.id = ?";
    const result = await db.query(sql, [pw, this.id]);
    return true;
  }

  // Add a new record to the users table
  async addUser(email, password, username, fname, lname, gender) {
    let profile_pic_url = "/image/profileImage.png";
    const pw = await bcrypt.hash(password, 10);
    var sql =
      "INSERT INTO User (email, password,username, first_name, last_name, gender, profile_pic_url) VALUES (? , ?, ? ,? ,?,?, ?)";
    const result = await db.query(sql, [
      email,
      pw,
      username,
      fname,
      lname,
      gender,
      profile_pic_url,
    ]);
    console.log(result.insertId);
    this.id = result.insertId;
    return true;
  }

  // Add a new record to the users table
  async updateUserUsername(email, username) {
    var sql = ` UPDATE user
    SET username = ?
    WHERE email = ?`;
    const result = await db.query(sql, [username, email]);
    return true;
  }

  async updateUserPassword(email, password) {
    var sql = ` UPDATE user
    SET password = ?
    WHERE email = ?`;
    const result = await db.query(sql, [password, email]);
    return true;
  }

  async updateUserProfilePic(email, imageName) {
    var sql = ` UPDATE user
    SET profile_pic_url = ?
    WHERE email = ?`;
    const result = await db.query(sql, [imageName, email]);
    return true;
  }

  // Test a submitted password against a stored password
  async authenticate(password) {
    // Get the stored, hashed password for the user
    var sql =
      "SELECT user_id,email,password,username,profile_pic_url FROM User WHERE user_id = ?";
    const result = await db.query(sql, [this.id]);
    //   const match = await bcrypt.compare(submitted, result[0].password);

    const match = await bcrypt.compare(password, result[0].password);
    if (result && match) {
      let userObj = {
        user_id: result[0].user_id,
        username: result[0].username,
        email: result[0].email,
        profile_pic: result[0].profile_pic_url,
      };
      return userObj;
    } else {
      return false;
    }
  }
}

module.exports = {
  User,
};
