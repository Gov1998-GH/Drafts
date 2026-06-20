"use strict";

const ROLES = require("../constants/roles");
const daoService = require("../dao/service-dao");

async function loadService(req, res, next) {
  try {
    const service = await daoService.getServiceById(req.params.id);
    if (!service)
      return res.status(404).json({ error: "Servizio non trovato" });
    req.service = service;
    next();
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento del servizio" });
  }
}

function canEditService(req, res, next) {
  const { user, service } = req;
  if (user.role === ROLES.ADMIN) return next();
  if (user.id === service.artistId) return next();
  res.status(403).json({ error: "Errore nei permessi del servizio" });
}

module.exports = { loadService, canEditService };
