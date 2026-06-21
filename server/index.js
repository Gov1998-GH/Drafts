"use strict";

//Caricamneto variabili d'ambiente
require("dotenv").config();

//import app anche qui
const app = require("./app");
const initDb = require("./init-db");

const PORT = process.env.PORT || 3001;


initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` SERVER IN ASCOLTO SU :http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Errore nella inizializzazione del DB:", err);
    process.exit(1);
  });


