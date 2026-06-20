"use strict";

//Caricamneto variabili d'ambiente
require("dotenv").config();

//import app anche qui
const app = require("./app");

const PORT = process.env.PORT || 3001;

//avvio del server
app.listen(PORT, () => {
  console.log(`   SERVER IN ASCOLTO SU :http://localhost:${PORT}`);
});
