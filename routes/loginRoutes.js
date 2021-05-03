const express = require('express');
const app = express();
const router = express.Router();
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const { body } = require('express-validator');

router.post('/', (req, res, next) => {
  // im not returning these errors since everything is validated client side.
  // just using it to escape. Although if this was a real app i would double check properly.
  body('username', '').trim().escape();
  body('password', '').escape();

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
