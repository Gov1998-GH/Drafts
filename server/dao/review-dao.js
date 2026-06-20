"use strict";

const db = require("../db.js");
const commission = require("../dao/commission-dao.js");
const STATUS = require("../constants/commissionStatus.js");

function mapReview(row) {
  return {
    id: row.id,
    commissionId: row.commission_id,
    commissionTitle: row.commission_title,
    clientId: row.client_id,
    clientUsername: row.client_username || "[utente eliminato]",
    artistId: row.artist_id,
    rating: row.rating,
    text: row.text,
    createdAt: row.created_at,
  };
}

exports.getReviewById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT reviews.id,
                        reviews.commission_id,
                        reviews.client_id,
                        reviews.rating,
                        reviews.text,
                        reviews.created_at,
                        commissions.title    AS commission_title,
                        commissions.artist_id,
                        users.username       AS client_username
                    FROM reviews
                    INNER JOIN commissions ON reviews.commission_id = commissions.id
                    LEFT  JOIN users       ON reviews.client_id     = users.id
                    WHERE reviews.id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapReview(row));
    });
  });
};

exports.getAllReviews = function (filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT reviews.id,
                          reviews.commission_id,
                          reviews.client_id,
                          users.username AS client_username,
                          reviews.rating,
                          reviews.text,
                          reviews.created_at,
                          commissions.title AS commission_title,
                          commissions.artist_id
                    FROM reviews
                    INNER JOIN commissions ON reviews.commission_id = commissions.id
                    LEFT  JOIN users       ON reviews.client_id = users.id`;

    const params = [];
    const conditions = [];

    if (filters.artistId) {
      conditions.push(`commissions.artist_id = ?`);
      params.push(filters.artistId);
    }

    if (filters.clientId) {
      conditions.push(`reviews.client_id = ?`);
      params.push(filters.clientId);
    }

    if (filters.minRating !== undefined) {
      conditions.push(`reviews.rating >= ?`);
      params.push(filters.minRating);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY reviews.created_at DESC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapReview));
    });
  });
};

exports.updateReview = function (id, review) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE reviews
                    SET text = ?
                    WHERE id = ?`;
    db.run(sql, [review.text, id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

exports.deleteReview = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM reviews WHERE id = ?`;

    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

exports.createReview = function (review) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN");

      const sql = `INSERT INTO reviews (commission_id, client_id, rating, text)
                        VALUES (?,?,?,?)`;
      db.run(
        sql,
        [review.commissionId, review.clientId, review.rating, review.text],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          const reviewId = this.lastID;

          const sqlUpdate = `UPDATE commissions 
                                   SET status = ?,
                                   updated_at = datetime('now')
                                   WHERE id = ?`;

          db.run(
            sqlUpdate,
            [STATUS.REVIEWED, review.commissionId],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }

              db.run("COMMIT", (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                resolve(reviewId);
              });
            },
          );
        },
      );
    });
  });
};

exports.getReviewByCommissionId = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT reviews.id,
                            reviews.commission_id,
                            reviews.rating,
                            reviews.text,
                            reviews.created_at,
                            commissions.title    AS commission_title,
                            commissions.artist_id,
                            users.username       AS client_username
                    FROM reviews
                    INNER JOIN commissions ON reviews.commission_id = commissions.id
                    LEFT  JOIN users       ON reviews.client_id     = users.id
                    WHERE reviews.commission_id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapReview(row));
    });
  });
};
