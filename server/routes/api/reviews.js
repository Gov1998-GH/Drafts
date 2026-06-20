"use strict";

const express = require("express");
const router = express.Router();
const daoReview = require("../../dao/review-dao");
const daoCommission = require("../../dao/commission-dao");
const daoNotification = require("../../dao/notification-dao");

const { requireAuth } = require("../../middleware/auth");
const logic = require("../../middleware/review-logic");

router.get("/", async (req, res) => {
  try {
    const reviews = await daoReview.getAllReviews(req.query);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero delle recensioni" });
  }
});

router.get("/:id", logic.loadReview, (req, res) => {
  res.status(200).json(req.review);
});

router.post("/", requireAuth, logic.canCreateReview, async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      clientId: req.user.id,
    };

    const newReviewId = await daoReview.createReview(reviewData);

    // Notifica l'artista della nuova recensione ricevuta
    const commission = await daoCommission.getCommissionById(
      req.body.commissionId,
    );
    if (commission)
      await daoNotification.create(
        commission.artistId,
        `Nuova recensione ricevuta per: ${commission.title}`,
      );

    res
      .status(201)
      .json({ id: newReviewId, message: "Recensione creata con successo" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Errore durante la creazione della recensione" });
  }
});

router.put(
  "/:id",
  requireAuth,
  logic.loadReview,
  logic.canUpdateReview,
  async (req, res) => {
    try {
      const newText = req.body.text;

      if (!newText)
        return res
          .status(400)
          .json({ error: "Il testo della recensione non può essere vuoto" });

      await daoReview.updateReview(req.params.id, { text: newText });
      res.status(200).json({ message: "Testo della recensione aggiornata" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Errore durante l'aggiornamento della recensione" });
    }
  },
);

router.delete(
  "/:id",
  requireAuth,
  logic.loadReview,
  logic.canDeleteReview,
  async (req, res) => {
    try {
      await daoReview.deleteReview(req.params.id);
      res.status(200).json({ message: "Recensione eliminata" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Errore durante l'eliminazione della recensione" });
    }
  },
);

module.exports = router;
