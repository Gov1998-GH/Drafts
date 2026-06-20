"use strict";

const ROLES = require('../constants/roles');

function hasRole(role) {
    return (req, res, next) => {

        if(!req.isAuthenticated())
            return res.status(401).json({ error: 'Non autenticato'});

        if(!req.user.role)
            return res.status(500).json({ error: 'Errore interno: ruolo utente mancante'});

        if(req.user.role !== role)
            return res.status(403).json({ error: 'Non autorizzato' });

        return next();
    };
}

function requireAuth(req, res, next) {
    if (!req.isAuthenticated())
        return res.status(401).json({ error: 'Non autenticato' });
    return next();
}

module.exports = {hasRole, requireAuth, ROLES};