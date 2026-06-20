"use strict";

const db = require("../db.js");

function mapService(row) {
  return {
    id: row.id,
    artistId: row.artist_id,
    displayName: row.display_name,
    name: row.name,
    description: row.description,
    price: row.price,
    deliveryDays: row.delivery_days,
    categoryId: row.category_id,
    categoryName: row.category_name,
  };
}

exports.getServiceById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT services.id,
                             services.artist_id,
                             artists.display_name,
                             services.name,
                             services.description,
                             services.price,
                             services.delivery_days,
                             services.category_id,
                             categories.name AS category_name
                    FROM services
                    INNER JOIN artists ON services.artist_id = artists.user_id
                    LEFT  JOIN categories ON categories.id = services.category_id
                    WHERE services.id = ?`;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapService(row));
    });
  });
};

exports.getAllServices = function (filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT
                      services.id,
                      services.artist_id,
                      artists.display_name,
                      services.name,
                      services.description,
                      services.price,
                      services.delivery_days,
                      services.category_id,
                      categories.name AS category_name
                    FROM services
                    INNER JOIN artists ON artists.user_id = services.artist_id
                    LEFT  JOIN categories ON categories.id = services.category_id`;

    const params = [];
    const conditions = [];

    if (filters.artistId) {
      conditions.push(`services.artist_id = ?`);
      params.push(filters.artistId);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      conditions.push(`services.price BETWEEN ? AND ?`);
      params.push(
        filters.minPrice !== undefined ? filters.minPrice : 0,
        filters.maxPrice !== undefined ? filters.maxPrice : 99999,
      );
    }

    if (filters.displayName) {
      conditions.push(`artists.display_name LIKE ?`);
      params.push(`%${filters.displayName}%`);
    }

    if (filters.categoryId) {
      conditions.push(`services.category_id = ?`);
      params.push(filters.categoryId);
    }

    if (filters.name) {
      conditions.push(`services.name LIKE ?`);
      params.push(`%${filters.name}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY artists.display_name ASC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapService));
    });
  });
};

exports.createService = function (service) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO services (artist_id, name, description, price, delivery_days, category_id)
                    VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [
        service.artistId,
        service.name,
        service.description,
        service.price,
        service.deliveryDays,
        service.categoryId,
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      },
    );
  });
};

exports.updateService = function (id, service) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE services
                    SET name = ?,
                        description = ?,
                        price = ?,
                        delivery_days = ?,
                        category_id = ?
                    WHERE id = ?`;
    db.run(
      sql,
      [
        service.name,
        service.description,
        service.price,
        service.deliveryDays,
        service.categoryId,
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

exports.deleteService = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM services WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};
