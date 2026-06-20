//Operazioni per lo user

"use strict";

const db = require("../db.js");
const bcrypt = require("bcrypt");
const ROLES = require("../constants/roles.js");

function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

//Restituisce un utente tramite l'ID
exports.getUserById = function (id) {
  return new Promise((resolve, reject) => {
    //gestione chiamate asincrone permette di attendere il risultato senza bloccare il resto del programma
    const sql = `
            SELECT id, 
                   username, 
                   email, 
                   role, 
                   created_at
            FROM users
            WHERE id = ?`; //Query SQL. ? serve per evitare SQL injection
    db.get(sql, [id], (err, row) => {
      //esegue la query sul db. [id] array contente il valore che sostituirà ?. Funzione di callback che viene eseguita quando il db risponde
      if (err) reject(err);
      else if (!row) resolve(null);
      else resolve(mapUser(row));
    });
  });
};

//Restituisce un utente tramite l'Email e password
exports.getUserByEmail = async function (email, password) {
  const row = await new Promise((resolve, reject) => {
    const sql = `
                SELECT id,
                       username,
                       email,
                       role,
                       created_at,
                       password_hash 
                FROM users 
                WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!row) return null;

  const passwordCorretta = await bcrypt.compare(password, row.password_hash);
  if (!passwordCorretta) return null;

  return mapUser(row);
};

exports.getAllUsers = function () {
  return new Promise((resolve, reject) => {
    const sql = `
            SELECT id,
                   username,
                   email,
                   role,
                   created_at
            FROM users`;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(mapUser));
    });
  });
};
//Creazione di un utente e/o artista
exports.createUser = async function (user, artist) {
  user.password = await bcrypt.hash(user.password, 10);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN");

      const sql = `
                INSERT 
                INTO users (username, 
                            email, 
                            password_hash, 
                            role)
                VALUES (?, ?, ?, ?)`;

      db.run(
        sql,
        [user.username, user.email, user.password, user.role],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          const userID = this.lastID;

          if (user.role === ROLES.ARTIST) {
            const sqlArt = `
                        INSERT INTO artists (user_id, 
                                             display_name, 
                                             bio, 
                                             city)
                        VALUES (?, ?, ?, ?)`;
            db.run(
              sqlArt,
              [userID, artist.displayName, artist.bio, artist.city],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                db.run("COMMIT");
                resolve(userID);
              },
            );
          } else {
            db.run("COMMIT");
            resolve(userID);
          }
        },
      );
    });
  });
};

exports.deleteUser = function (id) {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve(null);
      else resolve(id);
    });
  });
};

exports.updateUser = async function (user, artist) {
  let sql;
  let params;
  let passwordHash = null;

  if (user.password && user.password.trim() !== "") {
    passwordHash = await bcrypt.hash(user.password, 10);
    sql =
      "UPDATE users SET username = ?, email = ?, password_hash = ? WHERE id = ?";
    params = [user.username, user.email, passwordHash, user.id];
  } else {
    sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
    params = [user.username, user.email, user.id];
  }

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN");

      db.run(sql, params, function (err) {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }

        if (user.role === "artist" && artist) {
          const sqlArt = `UPDATE artists SET display_name = ?, bio = ?, city = ?, profile_image = ? WHERE user_id = ?`;

          db.run(
            sqlArt,
            [
              artist.displayName,
              artist.bio,
              artist.city,
              artist.profileImage,
              user.id,
            ],
            (err) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }
              db.run("COMMIT");
              resolve(user.id);
            },
          );
        } else {
          db.run("COMMIT");
          resolve(user.id);
        }
      });
    });
  });
};
