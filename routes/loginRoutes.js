const express = require('express');
const app = express();
const router = express.Router();
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;

router.post('/', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) throw err;

    if (!user) res.send('Incorrect username or password.');
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send(req.user);
      });
    }
  })(req, res, next);
});

module.exports = router;
