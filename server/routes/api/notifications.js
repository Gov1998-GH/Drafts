"use strict";

const express = require("express");
const router = express.Router();
const daoNotification = require("../../dao/notification-dao");
const { requireAuth } = require("../../middleware/auth");

// GET /api/notifications notifiche dell'utente
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await daoNotification.getByUser(req.user.id);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero delle notifiche" });
  }
});

// PUT /api/notifications/read segna tutte come lette
router.put("/read", requireAuth, async (req, res) => {
  try {
    await daoNotification.markAllRead(req.user.id);
    res.status(200).json({ message: "Notifiche segnate come lette" });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento notifiche" });
  }
});

// DELETE /api/notifications elimina tutte le notifiche dell'utente
router.delete("/", requireAuth, async (req, res) => {
  try {
    await daoNotification.deleteAll(req.user.id);
    res.status(200).json({ message: "Notifiche eliminate" });
  } catch (err) {
    res.status(500).json({ error: "Errore eliminazione notifiche" });
  }
});

// DELETE /api/notifications/:id elimina una notifica
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await daoNotification.deleteOne(req.params.id, req.user.id);
    res.status(200).json({ message: "Notifica eliminata" });
  } catch (err) {
    res.status(500).json({ error: "Errore eliminazione notifica" });
  }
});

module.exports = router;
