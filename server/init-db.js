"use strict";

const fs = require("fs");
const path = require("path");
const db = require("./db");

// Legge lo schema da database.sql
const schema = fs.readFileSync(
  path.join(__dirname, "..", "database.sql"),
  "utf8",
);

// Crea le tabelle solo se non esistono già (DB vuoto)
function initDb() {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(false); // già inizializzato
        db.exec(schema, (err) => {
          if (err) return reject(err);
          console.log("Database inizializzato da database.sql");
          resolve(true);
        });
      },
    );
  });
}

module.exports = initDb;