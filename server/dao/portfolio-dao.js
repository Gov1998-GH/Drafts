"use strict";

const db = require("../db.js");

function mapPortfolio(row) {
  return {
    id: row.id,
    artistId: row.artist_id,
    displayName: row.display_name,
    name: row.name,
    description: row.description,
    image: row.image,
    categoryId: row.category_id,
    createdAt: row.created_at,
  };
}

exports.getPortfolioById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT portfolios.id,
                            portfolios.artist_id,
                            artists.display_name,
                            portfolios.name,
                            portfolios.description,
                            portfolios.image,
                            portfolios.category_id,
                            portfolios.created_at
                    FROM portfolios
                    INNER JOIN artists ON artists.user_id = portfolios.artist_id
                    WHERE portfolios.id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapPortfolio(row));
    });
  });
};

exports.getAllPortfolios = function (filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT portfolios.id,
                          portfolios.artist_id,
                          portfolios.name,
                          artists.display_name,
                          portfolios.description,
                          portfolios.image,
                          portfolios.category_id,
                          portfolios.created_at
                    FROM portfolios
                    INNER JOIN artists ON artists.user_id = portfolios.artist_id`;

    const params = [];
    const conditions = [];

    if (filters.artistId) {
      conditions.push(`portfolios.artist_id = ?`);
      params.push(filters.artistId);
    }

    if (filters.displayName) {
      conditions.push(`artists.display_name LIKE ?`);
      params.push(`%${filters.displayName}%`);
    }

    if (filters.categoryId) {
      conditions.push(`portfolios.category_id = ?`);
      params.push(filters.categoryId);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY portfolios.name ASC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapPortfolio));
    });
  });
};

exports.createPortfolio = function (portfolio) {
  return new Promise((resolve, reject) => {
    const sql = ` INSERT INTO portfolios (artist_id, name, description, image, category_id)
                    VALUES (?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [
        portfolio.artistId,
        portfolio.name,
        portfolio.description,
        portfolio.image,
        portfolio.categoryId,
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      },
    );
  });
};

exports.updatePortfolio = function (id, portfolio) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE portfolios
                    SET name = ?,
                        description = ?,
                        image = ?,
                        category_id = ?
                    WHERE id = ?`;
    db.run(
      sql,
      [
        portfolio.name,
        portfolio.description,
        portfolio.image,
        portfolio.categoryId,
        id,
      ],
      function (err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else resolve(id);
      },
    );
  });
};

exports.deletePortfolio = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM portfolios WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};
