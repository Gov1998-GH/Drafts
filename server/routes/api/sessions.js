"use strict";

const express = require("express");
const router = express.Router();
const passport = require("../../auth/passport"); //Importo la config, di passport

/*POST api/sessions (login)*/
router.post("/", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err); //database down

    if (!user)
      //Credenziali errate
      return res.status(401).json({ error: info.message });

    //Gestione dei cookie se esiste l'utente (log)
    req.login(user, (err) => {
      if (err) return next(err);

      //Nota: req.user è disponibile tramite Passport
      return res.json(req.user);
    });
  })(req, res, next);
});

/* DELETE api/sessions/current (logout)*/
router.delete("/current", (req, res) => {
  req.logOut(() => {
    res.end();
  });
});

/*GET api/sessions/current (sessione)*/
router.get("/current", (req, res) => {
  if (req.isAuthenticated()) res.json(req.user);
  else res.status(401).json({ error: "Non autenticato" });
});

module.exports = router;
