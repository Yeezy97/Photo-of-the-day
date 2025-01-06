const db = require("../services/db");

class Post {
  // Id of the post
  id;

  constructor(id) {
    this.id = id;
  }

  async queryPostWithToken(req, res) {
    let sql = `
        SELECT 
    Post.post_id, 
    Post.title, 
    Post.image_url, 
    Post.description, 
    Post.location, 
    Post.like_count,
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
    CASE 
      WHEN user_likes_post.user_id IS NOT NULL THEN 1 
      ELSE 0 
    END AS is_liked,
    CASE 
      WHEN user_favourites_post.user_id IS NOT NULL THEN 1 
      ELSE 0 
    END AS is_favourited
  FROM 
    Post
  JOIN 
    User 
    ON Post.user_id = User.user_id
  LEFT JOIN 
    user_likes_post 
    ON Post.post_id = user_likes_post.post_id AND user_likes_post.user_id = ?
  LEFT JOIN 
    user_favourites_post 
    ON Post.post_id = user_favourites_post.post_id AND user_favourites_post.user_id = ?;`;

    try {
      let results = await db.query(sql, [req.user.userId, req.user.userId]);
      return results;
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryAllPost(req, res) {
    let sql =
      "SELECT Post.post_id,Post.title,Post.image_url,Post.description,Post.location,Post.like_count,Post.created_at AS post_created_at,User.user_id, User.username, User.email, User.profile_pic_url, User.gender, User.first_name, User.last_name, User.dob, User.age,User.created_at AS user_created_at FROM Post JOIN User ON Post.user_id = User.user_id";
    try {
      let results = await db.query(sql);
      return results;
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async getAllCategory(req, res) {
    try {
      let sql = `SELECT * 
      FROM Category`;
      return await db.query(sql);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryCategoryByName(req, res) {
    try {
      let sql = "SELECT * FROM CATEGORY WHERE category_name = ?";
      return await db.query(sql, [req.body.category]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryCategoryById(categoryName) {
    let sql = `SELECT 
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
            User.created_at AS user_created_at 
        FROM 
            Post 
        JOIN 
            User ON Post.user_id = User.user_id
        JOIN 
            Post_Category ON Post.post_id = Post_Category.post_id
        JOIN 
            Category ON Post_Category.category_id = Category.category_id 
        WHERE 
            Category.category_name = ?`;

    try {
      const results = await db.query(sql, [categoryName]);
      return results;
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryFavouritePost(req, res) {
    try {
      let sql = `
        SELECT 
    Post.post_id, 
    Post.title, 
    Post.image_url, 
    Post.description, 
    Post.location, 
    Post.like_count,
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
    CASE 
      WHEN user_likes_post.user_id IS NOT NULL THEN 1 
      ELSE 0 
    END AS is_liked,
    CASE 
      WHEN user_favourites_post.user_id IS NOT NULL THEN 1 
      ELSE 0 
    END AS is_favourited
    FROM 
    Post
    JOIN 
    User 
    ON Post.user_id = User.user_id
    LEFT JOIN 
    user_likes_post 
    ON Post.post_id = user_likes_post.post_id AND user_likes_post.user_id = ?
    JOIN 
    user_favourites_post 
    ON Post.post_id = user_favourites_post.post_id AND user_favourites_post.user_id = ?;`;

      const results = await db.query(sql, [req.user.userId, req.user.userId]);

      return results;
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryAddFvtPost(req, res, userIdFvtPost) {
    try {
      let sql =
        "INSERT IGNORE INTO user_favourites_post ( user_id, post_id ) VALUES (?,?)";
      const addFvtResult = await db.query(sql, [
        userIdFvtPost,
        req.body.postId,
      ]);

      if (addFvtResult.affectedRows === 0) {
        let sql =
          "DELETE FROM user_favourites_post WHERE user_id = ? AND post_id = ?";
        const result = await db.query(sql, [userIdFvtPost, req.body.postId]);
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryDeleteFvtPost(req, res) {
    try {
      let sql =
        "DELETE FROM user_favourites_post WHERE user_id = ? AND post_id = ?";
      const result = await db.query(sql, [req.user.userId, req.body.postId]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryLikePost(req, res, userIdFvtPost) {
    // IGNORE will not throw error, we can read response from daatabase
    let sql =
      "INSERT IGNORE INTO user_likes_post ( user_id, post_id ) VALUES (?,?)";
    return await db.query(sql, [userIdFvtPost, req.body.postId]);
  }

  async decrementPostLike(req, res) {
    let sqlPostLikeDecrement = `UPDATE post
    SET like_count = like_count - ${1}
    WHERE post_id = ?;`;
    return await db.query(sqlPostLikeDecrement, [req.body.postId]);
  }

  async queryDeletePostLike(req, res, userIdFvtPost) {
    let sql = "DELETE FROM user_likes_post WHERE user_id = ? AND post_id = ?";
    return await db.query(sql, [userIdFvtPost, req.body.postId]);
  }

  async queryPostLikeCount(req, res) {
    let like_count_sql = `SELECT like_count FROM post WHERE post_id = ?`;
    let result = await db.query(like_count_sql, [req.body.postId]);
    return result;
  }

  async setLikeCountDefault(req, res) {
    try {
      let sqlPostLikeDecrement = `UPDATE post
      SET like_count = ${0}
      WHERE post_id = ?;`;
      return await db.query(sqlPostLikeDecrement, [req.body.postId]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }

  async queryAddPostWithCategory(req, res) {
    // add post data in db
    let sql =
      "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
    const post_result = await db.query(sql, [
      req.user.userId,
      req.body.title,
      req.body.description,
      req.body.location,
      imageKey,
    ]);

    // add category
    sql = "INSERT INTO Category (category_name) VALUES (?)";
    const category_result = await db.query(sql, [req.body.category]);

    // link category
    sql = "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
    const post_category_result = await db.query(sql, [
      post_result.insertId,
      category_result.insertId,
    ]);
  }

  async queryPostLikeIncrement(req, res) {
    let sqlPostLikeIncrement = `UPDATE post
          SET like_count = like_count + ${1}
          WHERE post_id = ?;`;
    return await db.query(sqlPostLikeIncrement, [req.body.postId]);
  }

  async queryAddPost(req, res, imageKey, categoryResult) {
    try {
      let sql =
        "INSERT INTO Post ( user_id, title, description, location, image_url ) VALUES (?,?,?,?,?)";
      const result = await db.query(sql, [
        req.user.userId,
        req.body.title,
        req.body.description,
        req.body.location,
        imageKey,
      ]);

      // link post with category
      sql = "INSERT INTO Post_Category ( post_id, category_id ) VALUES (?,?)";
      const post_category_result = await db.query(sql, [
        result.insertId,
        categoryResult[0].category_id,
      ]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      res
        .status(500)
        .send(
          "An error occurred while retrieving posts. Please try again later."
        );
    }
  }
}

module.exports = {
  Post,
};
