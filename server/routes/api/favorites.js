"use strict";

const express = require("express");
const router = express.Router();
const daoFavorite = require("../../dao/favorite-dao");
const { requireAuth, hasRole, ROLES } = require("../../middleware/auth");

router.get("/", requireAuth, hasRole(ROLES.CLIENT), async (req, res) => {
  try {
    const favorites = await daoFavorite.getAllFavorites(req.user.id);
    res.status(200).json(favorites);
  } catch (err) {
    res.status(500).json({ error: "Errore nei recuperi dei preferiti" });
  }
});

router.post("/", requireAuth, hasRole(ROLES.CLIENT), async (req, res) => {
  try {
    if (!req.body.artistId)
      return res.status(400).json({ error: "Artist Id obbligatorio" });

    const toogle = await daoFavorite.toggleFavorite(
      req.user.id,
      req.body.artistId,
    );
    res.status(200).json(toogle);
  } catch (err) {
    res.status(500).json({ error: "Errore nel toogle" });
  }
});

module.exports = router;
