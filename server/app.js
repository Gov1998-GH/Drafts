"use strict";

const express = require("express");
const morgan = require("morgan"); // Per i log delle richieste
const path = require("path");
const session = require("express-session"); //Gestione sessioni
const passport = require("./auth/passport");

//Inizializzazione App
const app = express();

app.set("trust proxy", 1);

// Middleware Globali di base
app.use(morgan("dev")); //logga le richieste (GET /api/users 200)
app.use(express.json()); //Per leggere il corpo delle richieste (req.body)

/*Configurazione CORS (porta frontend != backend)
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true,
})); */

//Per i file statici
app.use(express.static(path.join(__dirname, "../public")));

//Configurazione di Sessione (Prima di PASSPORT)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", //per local false
      sameSite: "lax",
    },
  }),
);

//inizializzazione di passport
app.use(passport.initialize());
app.use(passport.session());

//routes api
app.use("/api/sessions", require("./routes/api/sessions"));
app.use("/api/users", require("./routes/api/user"));
app.use("/api/commissions", require("./routes/api/commission"));
app.use("/api/reviews", require("./routes/api/reviews"));
app.use("/api/categories", require("./routes/api/categories"));
app.use("/api/services", require("./routes/api/services"));
app.use("/api/portfolios", require("./routes/api/portfolios"));
app.use("/api/favorites", require("./routes/api/favorites"));
app.use("/api/uploads", require("./routes/api/uploads"));
app.use("/api/payments", require("./routes/api/payments"));
app.use("/api/notifications", require("./routes/api/notifications"));

app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
