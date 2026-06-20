"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../../middleware/auth");

// Cartella di destinazione: public/uploads
const uploadDir = path.join(__dirname, "..", "..", "..", "public", "uploads");

// Configurazione storage: nome file unico
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

// Accetta solo immagini, max 5MB
function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Solo immagini permesse"), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/uploads - carica una singola immagine, ritorna l'URL pubblico
router.post("/", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nessun file caricato" });
  // URL relativo servito da express.static (public/)
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
