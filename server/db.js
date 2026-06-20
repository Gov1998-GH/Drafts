//Connessione al database in Node.js
"use strict";

const sqlite = require("sqlite3"); //modulo per connettersi a SQLite

//Usare una variabile globale che contiene il path assoluto
const path = require("path");

const dbPath = path.join(__dirname, "..", "drafts.db");

//apertura del DB
const db = new sqlite.Database(dbPath, (err) => {
  if (err) throw err;
  console.log("Connessione stabilita");
});

db.run("PRAGMA foreign_keys = ON");

module.exports = db;
