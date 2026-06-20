"use strict";

const express = require("express");
const router = express.Router();
const daoCategories = require("../../dao/category-dao");
const { requireAuth, hasRole, ROLES } = require("../../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const categories = await daoCategories.getAllCategories();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero delle categorie" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await daoCategories.getCategoryById(req.params.id);
    if (!category)
      return res.status(404).json({ error: "Categoria non trovata" });
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della categoria" });
  }
});

router.post("/", requireAuth, hasRole(ROLES.ADMIN), async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "")
      return res.status(400).json({ error: "Nome categoria obbligatorio" });
    const id = await daoCategories.createCategory(req.body);
    res.status(201).json({ id, message: "Categoria creata" });
  } catch (err) {
    res.status(500).json({ error: "Errore nella creazione della categoria" });
  }
});

router.delete("/:id", requireAuth, hasRole(ROLES.ADMIN), async (req, res) => {
  try {
    const deleted = await daoCategories.deleteCategory(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Categoria non trovata" });
    res.status(200).json({ message: "Categoria eliminata" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Problemi nella eliminazione della categoria" });
  }
});

module.exports = router;
