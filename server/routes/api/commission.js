"use strict";

const express = require("express");
const router = express.Router();
const daoCommission = require("../../dao/commission-dao");
const daoNotification = require("../../dao/notification-dao");

const { requireAuth } = require("../../middleware/auth");
const logic = require("../../middleware/commission-logic");

// GET /api/commissions recupero tutte le commissioni
router.get("/", requireAuth, logic.autoFilterCommissions, async (req, res) => {
  try {
    const commissions = await daoCommission.getAllCommissions(
      req.commissionFilters,
    );
    res.status(200).json(commissions);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero delle commissioni" });
  }
});

// GET /api/commissions/:id ecupero singola commissione
router.get("/:id", requireAuth, logic.isInvolved, async (req, res) => {
  res.status(200).json(req.commission);
});

// POST /api/commissions crea una nuova commissione
router.post("/", requireAuth, logic.canCreate, async (req, res) => {
  try {
    const commissionData = {
      ...req.body,
      clientId: req.user.id,
      status: "pending",
      stripePaymentId: null,
      paymentStatus: "pending",
    };
    const id = await daoCommission.createCommission(commissionData);

    // Notifica l'artista della nuova richiesta
    await daoNotification.create(
      commissionData.artistId,
      `Nuova richiesta di commissione: ${commissionData.title}`,
    );

    res
      .status(201)
      .json({ id: id, message: "Commissione creata con successo" });
  } catch (err) {
    console.error("DETTAGLIO ERRORE:", err);
    res
      .status(500)
      .json({ error: "Errore durante la creazione della commissione" });
  }
});

// PATCH /api/commissions/:id/status aggiorna stato
router.patch(
  "/:id/status",
  requireAuth,
  logic.isInvolved,
  logic.validateStatusTransition,
  logic.canChangeStatus,
  async (req, res) => {
    try {
      // Consegna: l'immagine è obbligatoria quando si passa a 'delivered'
      if (req.body.status === "delivered" && !req.body.deliveryImage)
        return res
          .status(400)
          .json({ error: "Immagine di consegna obbligatoria" });

      const id = await daoCommission.updateStatus(
        req.params.id,
        req.body.status,
        req.body.deliveryImage,
      );
      if (!id)
        return res.status(404).json({ error: "Commissione non trovata" });

      // Notifiche al cliente sui cambi di stato
      if (req.body.status === "accepted")
        await daoNotification.create(
          req.commission.clientId,
          `Commissione accettata: ${req.commission.title}`,
        );
      if (req.body.status === "rejected")
        await daoNotification.create(
          req.commission.clientId,
          `Commissione rifiutata: ${req.commission.title}`,
        );
      if (req.body.status === "delivered")
        await daoNotification.create(
          req.commission.clientId,
          `Lavoro consegnato: ${req.commission.title}`,
        );

      res.status(200).json({ message: "Stato aggiornato" });
    } catch (err) {
      res.status(500).json({ error: "Errore aggiornamento stato" });
    }
  },
);

// PUT /api/commissions/:id aggiorna la commissione
router.put(
  "/:id",
  requireAuth,
  logic.isInvolved,
  logic.canUpdateCommission,
  async (req, res) => {
    try {
      await daoCommission.updateCommission(req.params.id, req.body);
      res.status(200).json({ message: "Commissione aggiornata" });
    } catch (err) {
      res.status(500).json({ error: "Errore nell'aggiornamento" });
    }
  },
);

// DELETE /api/commissions/:id elimina la commissione
router.delete(
  "/:id",
  requireAuth,
  logic.isInvolved,
  logic.canDelete,
  async (req, res) => {
    try {
      await daoCommission.deleteCommission(req.params.id);
      res.status(200).json({ message: "Commissione eliminata" });
    } catch (err) {
      res.status(500).json({ error: "Errore nell'eliminazione" });
    }
  },
);

module.exports = router;
