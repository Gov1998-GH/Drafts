"use strict";

const db = require("../db.js");

function mapArtist(row) {
  return {
    id: row.user_id,
    displayName: row.display_name,
    bio: row.bio,
    city: row.city,
    profileImage: row.profile_image,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
    avgRating:
      row.avg_rating !== null && row.avg_rating !== undefined
        ? Number(Number(row.avg_rating).toFixed(1))
        : null,
    reviewCount: row.review_count || 0,
  };
}

exports.getArtistById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT
                    artists.user_id,
                    artists.display_name,
                    artists.bio,
                    artists.city,
                    artists.profile_image,
                    users.username,
                    users.email,
                    users.created_at,
                    r.avg_rating,
                    r.review_count
                FROM artists
                INNER JOIN users ON artists.user_id = users.id
                LEFT JOIN (
                    SELECT commissions.artist_id,
                           AVG(reviews.rating)  AS avg_rating,
                           COUNT(reviews.id)    AS review_count
                    FROM reviews
                    JOIN commissions ON reviews.commission_id = commissions.id
                    GROUP BY commissions.artist_id
                ) AS r ON r.artist_id = artists.user_id
                WHERE users.id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapArtist(row));
    });
  });
};

exports.getAllArtists = function (filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = `
            SELECT DISTINCT
                artists.user_id,
                artists.display_name,
                artists.bio,
                artists.city,
                artists.profile_image,
                users.username,
                users.email,
                users.created_at,
                r.avg_rating,
                r.review_count
            FROM artists
            INNER JOIN users ON artists.user_id = users.id
            LEFT JOIN (
                SELECT commissions.artist_id,
                       AVG(reviews.rating)  AS avg_rating,
                       COUNT(reviews.id)    AS review_count
                FROM reviews
                JOIN commissions ON reviews.commission_id = commissions.id
                GROUP BY commissions.artist_id
            ) AS r ON r.artist_id = artists.user_id`;

    const params = [];
    const conditions = [];

    if (filters.categoryId) {
      sql += ` JOIN portfolios ON portfolios.artist_id = artists.user_id`;
      conditions.push(`portfolios.category_id = ?`);
      params.push(filters.categoryId);
    }

    if (filters.city) {
      conditions.push(`artists.city LIKE ?`);
      params.push(`%${filters.city}%`);
    }

    if (filters.displayName) {
      conditions.push(`artists.display_name LIKE ?`);
      params.push(`%${filters.displayName}%`);
    }

    if (filters.minRating !== undefined || filters.maxRating !== undefined) {
      conditions.push(`r.avg_rating BETWEEN ? AND ?`);
      params.push(
        filters.minRating !== undefined ? Number(filters.minRating) : 0,
        filters.maxRating !== undefined ? Number(filters.maxRating) : 5,
      );
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY r.avg_rating DESC NULLS LAST, artists.display_name ASC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapArtist));
    });
  });
};
