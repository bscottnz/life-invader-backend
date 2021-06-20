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
        let day = new Date().toDateString();
        day = day.slice(0, day.length - 5);
        const time = new Date().toLocaleTimeString('en-NZ');
        const date = `${day}: ${time}`;
        await Login.create({ username: req.user.username, date: date });

        res.send(req.user);
      });
    }
  })(req, res, next);
});

module.exports = router;
