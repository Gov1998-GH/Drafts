"use strict";

const db = require("../db.js");

function mapFavorite(row) {
  return {
    id: row.artist_id,
    displayName: row.display_name,
    bio: row.bio,
    profileImage: row.profile_image,
  };
}

exports.getAllFavorites = function (clientId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT favorites.artist_id,
                            artists.display_name,
                            artists.bio,
                            artists.profile_image
                    FROM favorites
                    INNER JOIN artists ON artists.user_id = favorites.artist_id
                    WHERE favorites.client_id = ?`;
    db.all(sql, [clientId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapFavorite));
    });
  });
};

exports.toggleFavorite = function (clientId, artistId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const sql = `SELECT 1 FROM favorites WHERE client_id = ? AND artist_id = ?`;

      db.get(sql, [clientId, artistId], (err, row) => {
        if (err) return reject(err);

        if (row) {
          const delSql = `DELETE FROM favorites WHERE client_id = ? AND artist_id = ?`;
          db.run(delSql, [clientId, artistId], function (err) {
            if (err) return reject(err);
            else resolve({ status: "removed" });
          });
        } else {
          const addSql = `INSERT INTO favorites (client_id, artist_id) VALUES (?,?)`;
          db.run(addSql, [clientId, artistId], function (err) {
            if (err) return reject(err);
            else resolve({ status: "added" });
          });
        }
      });
    });
  });
};
