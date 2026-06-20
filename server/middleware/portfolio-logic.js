"use strict";

const ROLES = require("../constants/roles");
const daoPortfolio = require("../dao/portfolio-dao");

async function loadPortfolio(req, res, next) {
  try {
    const portfolio = await daoPortfolio.getPortfolioById(req.params.id);
    if (!portfolio)
      return res.status(404).json({ error: "Portfolio non trovato" });
    req.portfolio = portfolio;
    next();
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento del portfolio" });
  }
}

function canEditPortfolio(req, res, next) {
  const { user, portfolio } = req;
  if (user.role === ROLES.ADMIN) return next();
  if (user.id === portfolio.artistId) return next();
  res.status(403).json({ error: "Errore nei permessi del portfolio" });
}

function isValidImage(url) {
  if (!url) return false;
  return /^(https?:\/\/|\/)/i.test(url);
}

module.exports = { loadPortfolio, canEditPortfolio, isValidImage };
