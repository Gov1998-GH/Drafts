"use strict";

const express = require("express");
const router = express.Router();
const daoPortfolio = require("../../dao/portfolio-dao");
const daoCategory = require("../../dao/category-dao");
const { requireAuth, hasRole, ROLES } = require("../../middleware/auth");
const logic = require("../../middleware/portfolio-logic");

router.get("/", async (req, res) => {
  try {
    const portfolios = await daoPortfolio.getAllPortfolios(req.query);
    res.status(200).json(portfolios);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei portfolio" });
  }
});

router.get("/:id", logic.loadPortfolio, (req, res) => {
  res.status(200).json(req.portfolio);
});

router.post(
  "/",
  requireAuth,
  hasRole(ROLES.ARTIST),
  async (req, res) => {
    try {
      if (!req.body.name || req.body.name.trim() === "")
        return res.status(400).json({ error: "Nome portfolio obbligatorio" });
      if (!req.body.image || req.body.image.trim() === "")
        return res
          .status(400)
          .json({ error: "Indirizzo dell'immagine non può essere vuoto" });
      if (!logic.isValidImage(req.body.image))
        return res
          .status(400)
          .json({
            error: "URL immagine non valido (solo http://, https:// o /)",
          });
      if (req.body.categoryId) {
        const category = await daoCategory.getCategoryById(req.body.categoryId);
        if (!category)
          return res.status(404).json({ error: "Categoria non valida" });
      }
      const portfolioData = {
        ...req.body,
        artistId: req.user.id,
      };
      const id = await daoPortfolio.createPortfolio(portfolioData);
      res.status(201).json({ id, message: "Portfolio creato" });
    } catch (err) {
      res.status(500).json({ error: "Errore nella creazione del portfolio" });
    }
  },
);

router.put(
  "/:id",
  requireAuth,
  logic.loadPortfolio,
  logic.canEditPortfolio,
  async (req, res) => {
    try {
      if (!req.body.name || req.body.name.trim() === "")
        return res
          .status(400)
          .json({ error: "Nome del portfolio obbligatorio" });
      if (!req.body.image || req.body.image.trim() === "")
        return res
          .status(400)
          .json({ error: "Indirizzo della immagine non può essere vuoto" });
      if (!logic.isValidImage(req.body.image))
        return res
          .status(400)
          .json({
            error: "URL immagine non valido (solo http://, https:// o /)",
          });
      if (req.body.categoryId) {
        const category = await daoCategory.getCategoryById(req.body.categoryId);
        if (!category)
          return res.status(404).json({ error: "Categoria non valida" });
      }
      await daoPortfolio.updatePortfolio(req.params.id, req.body);
      res.status(200).json({ message: "Portfolio aggiornato" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Errore nell'aggiornamento del portfolio" });
    }
  },
);

router.delete(
  "/:id",
  requireAuth,
  logic.loadPortfolio,
  logic.canEditPortfolio,
  async (req, res) => {
    try {
      await daoPortfolio.deletePortfolio(req.params.id);
      res.status(200).json({ message: "Portfolio eliminato" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Problemi nella eliminazione del portfolio" });
    }
  },
);

module.exports = router;
