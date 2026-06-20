"use strict";

const db = require("../db.js");

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  };
}

exports.getCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
                        id,
                        name,
                        description
                    FROM categories
                    WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapCategory(row));
    });
  });
};

exports.getAllCategories = function () {
  return new Promise((resolve, reject) => {
    const sql = `SELECT
                        id,
                        name,
                        description
                    FROM categories`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapCategory));
    });
  });
};

exports.createCategory = function (category) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT
                     INTO categories (name,
                                      description)
                     VALUES (?,?)`;
    db.run(sql, [category.name, category.description], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

exports.deleteCategory = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM categories WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};
