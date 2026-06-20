"use strict";

const STATUS = require("../constants/commissionStatus");
const ROLES = require("../constants/roles");
const daoReview = require("../dao/review-dao");
const daoCommission = require("../dao/commission-dao");

async function loadReview(req, res, next) {
  try {
    const review = await daoReview.getReviewById(req.params.id);
    if (!review)
      return res.status(404).json({ error: "Recensione non trovata" });
    req.review = review;
    next();
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento della recensione" });
  }
}

async function canCreateReview(req, res, next) {
  const { commissionId } = req.body;
  const userId = req.user.id;

  try {
    const existing = await daoReview.getReviewByCommissionId(commissionId);

    if (existing)
      return res.status(409).json({ error: "Recensione già esistente" });

    const commission = await daoCommission.getCommissionById(commissionId);

    if (!commission)
      return res.status(404).json({ error: "Commissione non trovata" });
    if (commission.status !== STATUS.DELIVERED)
      return res
        .status(400)
        .json({ error: "Puoi recensire solo commissioni consegnate" });
    if (commission.clientId === userId) return next();
    res
      .status(403)
      .json({ error: "Non sei autorizzato a recensire questa commissione" });
  } catch (err) {
    res.status(500).json({ error: "Errore durante la verifica dei permessi" });
  }
}

function canUpdateReview(req, res, next) {
  const { user, review } = req;
  if (user.role === ROLES.ADMIN || user.id === review.clientId) return next();
  res.status(403).json({ error: "Non puoi modificare questa recensione" });
}

function canDeleteReview(req, res, next) {
  const { user, review } = req;
  if (user.role === ROLES.ADMIN) return next();
  if (user.id === review.clientId) return next();

  res.status(403).json({ error: "Eliminazione non permessa" });
}

module.exports = {
  loadReview,
  canCreateReview,
  canUpdateReview,
  canDeleteReview,
};
