"use strict";

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./db");

const schema = fs.readFileSync(
  path.join(__dirname, "..", "database.sql"),
  "utf8",
);


function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

// Crea admin + categorie di base
async function seed() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@drafts.it";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  await run(
    "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    [username, email, hash],
  );

  const categorie = [
    ["Illustrazione", "Disegni e illustrazioni digitali"],
    ["Character Design", "Creazione di personaggi"],
    ["Ritratti", "Ritratti su commissione"],
    ["Logo & Branding", "Loghi e identità visiva"],
    ["Concept Art", "Concept per giochi e film"],
  ];
  for (const [name, desc] of categorie) {
    await run("INSERT INTO categories (name, description) VALUES (?, ?)", [
      name,
      desc,
    ]);
  }
  console.log("Seed completato: admin + categorie");
}

async function initDb() {
  const row = await get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
  );
  if (row) return false; 
  await exec(schema);
  console.log("Database inizializzato da database.sql");
  await seed();
  return true;
}

module.exports = initDb;
