const express = require('express');
const app = express();
const router = express.Router();
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const { body } = require('express-validator');

const Login = require('../models/LoginSchema');

router.post('/', (req, res, next) => {
  // im not returning these errors since everything is validated client side.
  // just using it to escape. Although if this was a real app i would double check properly.
  body('username', '').trim().escape();
  body('password', '').escape();

  passport.authenticate('local', (err, user, info) => {
    if (err) throw err;

    if (!user) res.send('Incorrect username or password.');
    else {
      req.logIn(user, async (err) => {
        if (err) throw err;

        // update database to reflect a new user login. just for my own interest to see how many
        // people try out the site
        await Login.create({ userName: req.user.username });

        res.send(req.user);
      });
    }
  })(req, res, next);
});

module.exports = router;
