"use strict";

const express = require("express");
const router = express.Router();
const daoService = require("../../dao/service-dao");
const { requireAuth, hasRole, ROLES } = require("../../middleware/auth");
const logic = require("../../middleware/service-logic");

router.get("/", async (req, res) => {
  try {
    const services = await daoService.getAllServices(req.query);
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ error: "Errore nei recuperi dei servizi" });
  }
});

router.get("/:id", logic.loadService, (req, res) => {
  res.status(200).json(req.service);
});

router.post("/", requireAuth, hasRole(ROLES.ARTIST), async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "")
      return res.status(400).json({ error: "Nome servizio obbligatorio" });
    if (!req.body.price || req.body.price <= 0)
      return res
        .status(400)
        .json({ error: "Prezzo obbligatorio e maggiore di 0" });
    if (!req.body.deliveryDays || req.body.deliveryDays <= 0)
      return res
        .status(400)
        .json({ error: "I giorni di spedizione devono essere maggiori di 0" });
    const serviceData = {
      ...req.body,
      artistId: req.user.id,
    };
    const id = await daoService.createService(serviceData);
    res.status(201).json({ id, message: "Servizio creato" });
  } catch (err) {
    res.status(500).json({ error: "Errore nella creazione dei servizi" });
  }
});

router.put(
  "/:id",
  requireAuth,
  logic.loadService,
  logic.canEditService,
  async (req, res) => {
    try {
      if (!req.body.name || req.body.name.trim() === "")
        return res.status(400).json({ error: "Nome servizio obbligatorio" });
      if (!req.body.price || req.body.price <= 0)
        return res
          .status(400)
          .json({ error: "Prezzo obbligatorio e maggiore di 0" });
      if (!req.body.deliveryDays || req.body.deliveryDays <= 0)
        return res
          .status(400)
          .json({
            error: "I giorni di spedizione devono essere maggiori di 0",
          });
      await daoService.updateService(req.params.id, req.body);
      res.status(200).json({ message: "Servizio aggiornato" });
    } catch (err) {
      res.status(500).json({ error: "Errore nell'aggiornamento del servizio" });
    }
  },
);

router.delete(
  "/:id",
  requireAuth,
  logic.loadService,
  logic.canEditService,
  async (req, res) => {
    try {
      await daoService.deleteService(req.params.id);
      res.status(200).json({ message: "Servizio eliminato" });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Problemi nella eliminazione dei servizi" });
    }
  },
);

module.exports = router;
