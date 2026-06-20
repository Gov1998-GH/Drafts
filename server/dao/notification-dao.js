"use strict";

const db = require("../db.js");

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  };
}

// Notifiche di un utente, più recenti prima
exports.getByUser = function (userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, user_id, message, is_read, created_at
                 FROM notifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC`;
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapNotification));
    });
  });
};

// Crea una notifica per un utente
exports.create = function (userId, message) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO notifications (user_id, message) VALUES (?, ?)`;
    db.run(sql, [userId, message], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Segna come lette tutte le notifiche dell'utente
exports.markAllRead = function (userId) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
    db.run(sql, [userId], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Elimina una notifica
exports.deleteOne = function (id, userId) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM notifications WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

// Elimina tutte le notifiche dell'utente
exports.deleteAll = function (userId) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM notifications WHERE user_id = ?`;
    db.run(sql, [userId], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};
