"use strict";

const passport = require("passport");
const LocalStrategy = require("passport-local");
const userDao = require("../dao/user-dao");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function verify(email, password, done) {
      try {
        const user = await userDao.getUserByEmail(email, password);

        if (!user) return done(null, false, { message: "Credenziali errate." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDao.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
