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

  // Add a password to an existing user
  async setUserPassword(password) {
    const pw = await bcrypt.hash(password, 10);
    var sql = "UPDATE User SET password = ? WHERE User.id = ?";
    const result = await db.query(sql, [pw, this.id]);
    return true;
  }

  // Add a new record to the users table
  async addUser(password) {
    const pw = await bcrypt.hash(password, 10);
    var sql = "INSERT INTO User (email, password) VALUES (? , ?)";
    const result = await db.query(sql, [this.email, pw]);
    console.log(result.insertId);
    this.id = result.insertId;
    return true;
  }

  // Test a submitted password against a stored password
  async authenticate(password) {
    // Get the stored, hashed password for the user
    console.log("authenticate functions");

    var sql = "SELECT password FROM User WHERE user_id = ?";
    const result = await db.query(sql, [this.id]);
    //   const match = await bcrypt.compare(submitted, result[0].password);
    console.log(result, "from database");

    if (result[0].password === password) {
      return true;
    } else {
      return false;
    }
    //   if (match == true) {
    //       return true;
    //   }
    //   else {
    //       return false;
    //   }
  }
}

module.exports = {
  User,
};
