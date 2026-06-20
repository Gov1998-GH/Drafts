"use strict";

const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const daoCommission = require("../../dao/commission-dao");
const daoNotification = require("../../dao/notification-dao");
const { requireAuth } = require("../../middleware/auth");

// POST /api/payments/checkout - crea una sessione Stripe Checkout per una commissione
router.post("/checkout", requireAuth, async (req, res) => {
  try {
    const { commissionId } = req.body;
    const commission = await daoCommission.getCommissionById(commissionId);

    if (!commission)
      return res.status(404).json({ error: "Commissione non trovata" });
    if (commission.clientId !== req.user.id)
      return res.status(403).json({ error: "Non autorizzato" });
    if (commission.status !== "accepted")
      return res
        .status(400)
        .json({ error: "La commissione deve essere accettata" });
    if (commission.paymentStatus === "paid")
      return res.status(400).json({ error: "Già pagata" });

    const base = `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: commission.title },
            unit_amount: commission.price * 100, // Stripe usa i centesimi controllato la documentazione
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/payment-success?cid=${commissionId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/my-commissions`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: "Errore nella creazione del pagamento" });
  }
});

// POST /api/payments/confirm verifico il pagamento e sblocca la commissione
router.post("/confirm", requireAuth, async (req, res) => {
  try {
    const { sessionId, commissionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid")
      return res.status(400).json({ error: "Pagamento non completato" });

    await daoCommission.markPaid(commissionId, session.payment_intent);

    // Notifica l'artista che il pagamento è stato ricevuto
    const commission = await daoCommission.getCommissionById(commissionId);
    if (commission)
      await daoNotification.create(
        commission.artistId,
        `Pagamento ricevuto per: ${commission.title}`,
      );

    res.status(200).json({ message: "Pagamento confermato" });
  } catch (err) {
    console.error("Stripe confirm error:", err);
    res.status(500).json({ error: "Errore nella conferma del pagamento" });
  }
});

module.exports = router;
