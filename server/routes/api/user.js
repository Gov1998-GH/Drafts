"use strict";

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const dao = require("../../dao/user-dao");
const daoA = require("../../dao/artist-dao");

const validationRegistration = [
  //user + admin
  body("username").trim().notEmpty().withMessage("Username obbligatorio"),
  body("email").isEmail().withMessage("Email non valida").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("La password deve essere almeno di 8 caratteri"),
  body("role")
    .isIn(["client", "artist", "admin"])
    .withMessage("Ruolo non valido"),

  //artist
  body("displayName")
    .if(body("role").equals("artist"))
    .trim()
    .notEmpty()
    .withMessage("Nome è obbligatorio per gli artisti"),
  body("city")
    .if(body("role").equals("artist"))
    .trim()
    .notEmpty()
    .withMessage("Città obbligatoria per gli artisti"),
  body("bio")
    .if(body("role").equals("artist"))
    .trim()
    .isLength({ max: 500 })
    .withMessage("La bio è troppo lunga"),
];

//GET /api/users/artists - Recupera tutti gli artisti con filtri
router.get("/artists", async (req, res) => {
  try {
    const artists = await daoA.getAllArtists(req.query);
    res.status(200).json(artists);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli artisti" });
  }
});

//GET /api/users/artists/:id - Recupero singolo artista
router.get("/artists/:id", async (req, res) => {
  try {
    const artist = await daoA.getArtistById(req.params.id);
    if (!artist) return res.status(404).json({ error: "Artista non trovato" });
    res.status(200).json(artist);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dell'artista" });
  }
});

//GET /api/users - Recupera tutti gli utenti
router.get("/", async (req, res) => {
  try {
    const users = await dao.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli utenti" });
  }
});

//GET /api/user/:id - Recupero singolo utente
router.get("/:id", async (req, res) => {
  try {
    const user = await dao.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: `Errore nel recupero dell'utente ${req.params.id}` });
  }
});

//POST /api/users/ - Registrazione (User/Artist)
router.post("/", validationRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  //prende i dati tramite req.body
  const { username, email, password, role, displayName, bio, city } = req.body;
  const user = { username, email, password, role };
  const artist = { displayName, bio, city };

  try {
    const userId = await dao.createUser(user, artist);

    //Preparazione oggetto per Passport
    const newUser = {
      id: userId,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    //autologin con promisify req.login
    await new Promise((resolve, reject) => {
      req.login(newUser, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    //success
    return res.status(201).json(newUser);
  } catch (err) {
    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      err.message.includes("UNIQUE")
    ) {
      return res.status(409).json({
        error: "Username o Email già in uso. Scegline altri",
      });
    }

    console.error("Registration Error:", err);
    res.status(500).json({ error: "Errore durante la creazione dell'account" });
  }
});

//PUT /api/users/:id - Modifica
router.put("/:id", async (req, res) => {
  try {
    const updated = await dao.updateUser(req.body.user, req.body.artist);
    res.status(200).json({ id: updated });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'update" });
  }
});

//DELETE /api/users/:id - Eliminazione
router.delete("/:id", async (req, res) => {
  try {
    await dao.deleteUser(req.params.id);
    res.status(200).json({ message: "Eliminato" });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

module.exports = router;
