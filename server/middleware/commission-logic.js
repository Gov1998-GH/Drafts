"use strict";

const ROLES = require("../constants/roles");
const STATUS = require("../constants/commissionStatus");
const daoCommission = require("../dao/commission-dao");
const daoUser = require("../dao/user-dao");

async function isInvolved(req, res, next) {
  try {
    const commission = await daoCommission.getCommissionById(req.params.id);
    if (!commission)
      return res.status(404).json({ error: "Commissione non trovata" });

    if (
      req.user.role === ROLES.ADMIN ||
      req.user.id === commission.clientId ||
      req.user.id === commission.artistId
    ) {
      req.commission = commission; //Passiamo l'oggetto nella rotta
      return next();
    }
    res
      .status(403)
      .json({ error: "Non hai i permessi per questa commissione" });
  } catch (err) {
    res.status(500).json({ error: "Errori controllo permessi" });
  }
}

function autoFilterCommissions(req, res, next) {
  const filters = { ...req.query };

  if (req.user.role === ROLES.ARTIST) {
    filters.artistId = req.user.id;
    delete filters.clientId;
  } else if (req.user.role !== ROLES.ADMIN) {
    filters.clientId = req.user.id;
    delete filters.artistId;
  }

  req.commissionFilters = filters;
  next();
}

async function canCreate(req, res, next) {
  const { artistId } = req.body;
  if (Number(req.user.id) === Number(artistId)) {
    return res.status(400).json({ error: "Non puoi commissionare te stesso" });
  }

  try {
    const artist = await daoUser.getUserById(artistId);
    if (!artist || artist.role !== ROLES.ARTIST) {
      return res.status(404).json({ error: "Artista non valido" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Errore validazione artista" });
  }
}

function validateStatusTransition(req, res, next) {
  if (!req.body.status) return next();
  const current = req.commission.status;
  const nextStatus = req.body.status;

  const transitions = {
    [STATUS.PENDING]: [STATUS.ACCEPTED, STATUS.REJECTED],
    [STATUS.ACCEPTED]: [STATUS.IN_PROGRESS],
    [STATUS.IN_PROGRESS]: [STATUS.DELIVERED],
    [STATUS.DELIVERED]: [STATUS.REVIEWED],
    [STATUS.REJECTED]: [],
    [STATUS.REVIEWED]: [],
  };

  const allowed = transitions[current] || [];
  if (!allowed.includes(nextStatus))
    return res
      .status(400)
      .json({
        error: `Transizione da ${current} a ${nextStatus} non permessa`,
      });
  next();
}

function canUpdateCommission(req, res, next) {
  const { user, commission } = req;

  if (user.id === commission.clientId) {
    if (commission.status !== STATUS.PENDING) {
      return res
        .status(403)
        .json({
          error:
            "Non puoi modificare la richiesta: è già stata accettata o rifiutata",
        });
    }
    return next();
  }
  if (
    user.id === commission.artistId &&
    [STATUS.PENDING, STATUS.ACCEPTED].includes(commission.status)
  )
    return next();
  if (user.role === ROLES.ADMIN) return next();
  res.status(403).json({ error: "Azioni non autorizzate" });
}

function canDelete(req, res, next) {
  const { user, commission } = req;
  if (user.role === ROLES.ADMIN) return next();
  if (user.id === commission.clientId && commission.status === STATUS.PENDING)
    return next();

  res.status(403).json({ error: "Eliminazione non permessa" });
}

function canChangeStatus(req, res, next) {
  const { user, commission } = req;
  const target = req.body.status;

  if (user.role === ROLES.ADMIN) return next();

  const artistTransitions = [
    STATUS.ACCEPTED,
    STATUS.REJECTED,
    STATUS.DELIVERED,
  ];
  const clientTransitions = [STATUS.REVIEWED];

  if (user.id === commission.artistId && artistTransitions.includes(target))
    return next();
  if (user.id === commission.clientId && clientTransitions.includes(target))
    return next();

  res.status(403).json({ error: "Non puoi impostare questo stato" });
}

module.exports = {
  isInvolved,
  autoFilterCommissions,
  canCreate,
  validateStatusTransition,
  canUpdateCommission,
  canDelete,
  canChangeStatus,
};
