"use strict";

const db = require("../db.js");

function mapCommission(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientUsername: row.client_username || "[utente eliminato]",
    artistId: row.artist_id,
    artistDisplayName: row.display_name,
    serviceId: row.service_id,
    title: row.title,
    description: row.description,
    price: row.price,
    status: row.status,
    stripePaymentId: row.stripe_payment_id,
    paymentStatus: row.payment_status,
    deliveryImage: row.delivery_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.getCommissionById = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT
                            commissions.id,
                            commissions.client_id,
                            commissions.artist_id,
                            commissions.service_id,
                            commissions.title,
                            commissions.description,
                            commissions.price,
                            commissions.status,
                            commissions.stripe_payment_id,
                            commissions.payment_status,
                            commissions.delivery_image,
                            commissions.created_at,
                            commissions.updated_at,
                            artists.display_name,
                            users.username AS client_username
                    FROM commissions
                    INNER JOIN artists ON artists.user_id = commissions.artist_id
                    LEFT  JOIN users ON users.id = commissions.client_id
                    WHERE commissions.id = ?`;

    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapCommission(row));
    });
  });
};

exports.getAllCommissions = function (filters = {}) {
  return new Promise((resolve, reject) => {
    let sql = ` SELECT  
                        commissions.id,
                        commissions.client_id,
                        commissions.artist_id,
                        commissions.service_id,
                        commissions.title,
                        commissions.description,
                        commissions.price,
                        commissions.status,
                        commissions.stripe_payment_id,
                        commissions.payment_status,
                        commissions.delivery_image,
                        commissions.created_at,
                        commissions.updated_at,
                        artists.display_name,
                        users.username AS client_username
                    FROM commissions
                    INNER JOIN artists ON artists.user_id = commissions.artist_id
                    LEFT  JOIN users ON users.id = commissions.client_id`;

    const params = [];
    const conditions = [];

    if (filters.artistId) {
      conditions.push(`commissions.artist_id = ?`);
      params.push(filters.artistId);
    }

    if (filters.clientId) {
      conditions.push(`commissions.client_id = ?`);
      params.push(filters.clientId);
    }

    if (filters.status) {
      conditions.push(`commissions.status = ?`);
      params.push(filters.status);
    }

    if (filters.fromDate) {
      conditions.push(`commissions.created_at >= ?`);
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      conditions.push(`commissions.created_at <= ?`);
      params.push(filters.toDate);
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`commissions.price >= ?`);
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`commissions.price <= ?`);
      params.push(filters.maxPrice);
    }

    if (filters.query) {
      conditions.push(`commissions.title LIKE ?`);
      params.push(`%${filters.query}%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(` AND `);
    }

    sql += ` ORDER BY commissions.created_at DESC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapCommission));
    });
  });
};

exports.createCommission = function (commission) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO commissions (client_id, artist_id, service_id, title, description,
                    price, status, stripe_payment_id, payment_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        commission.clientId,
        commission.artistId,
        commission.serviceId,
        commission.title,
        commission.description,
        commission.price,
        commission.status,
        commission.stripePaymentId,
        commission.paymentStatus,
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      },
    );
  });
};

exports.updateCommission = function (id, commission) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE commissions
                    SET title = ?, 
                        description = ?,
                        price = ?,
                        updated_at = datetime('now')
                    WHERE id = ?`;
    db.run(
      sql,
      [commission.title, commission.description, commission.price, id],
      function (err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else resolve(id);
      },
    );
  });
};

exports.updateStatus = function (id, status, deliveryImage) {
  return new Promise((resolve, reject) => {
    let sql;
    let params;
    // Se viene passata un'immagine di consegna, la salviamo insieme allo stato
    if (deliveryImage !== undefined && deliveryImage !== null) {
      sql = `UPDATE commissions
                    SET status = ?,
                        delivery_image = ?,
                        updated_at = datetime('now')
                    WHERE id = ?`;
      params = [status, deliveryImage, id];
    } else {
      sql = `UPDATE commissions
                    SET status = ?,
                        updated_at = datetime('now')
                    WHERE id = ?`;
      params = [status, id];
    }
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

// Segna la commissione come pagata e la sblocca a in_progress
exports.markPaid = function (id, paymentIntentId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE commissions
                    SET payment_status = 'paid',
                        status = 'in_progress',
                        stripe_payment_id = ?,
                        updated_at = datetime('now')
                    WHERE id = ?`;
    db.run(sql, [paymentIntentId, id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

exports.deleteCommission = function (id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM commissions WHERE id = ?`;
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};
