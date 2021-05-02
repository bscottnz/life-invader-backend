const express = require('express');
const app = express();
const router = express.Router();
const User = require('../models/UserSchema');
const bcrypt = require('bcryptjs');

router.post('/', async (req, res) => {
  const firstName = req.body.firstName.trim();
  const lastName = req.body.lastName.trim();
  const username = req.body.username.trim();
  const email = req.body.email.trim();
  const password = req.body.password;

  if (firstName && lastName && username && email && password) {
    // find any previous users with the entered username or email

    const user = await User.findOne({
      $or: [{ username: username }, { email: email }],
    }).catch((err) => {
      console.log(err);
      // send an error
      // have generic error page
    });

    if (user == null) {
      // no user found so can create a new one

      const data = {
        firstName,
        lastName,
        username,
        email,
        password,
      };

      data.password = await bcrypt.hash(password, 10);

      User.create(data).then((user) => {
        console.log(user);
        return res.status(200).send(user);
      });
    } else {
      // previous user with provided credentials found
      if (email === user.email) {
        // email in use, send error message
        res.status(200).send('Email already in use.');
        console.log('email in use');
      } else {
        // username in use, send error message
        res.status(200).send('Username already in use.');
        console.log('username in use');
      }
    }
  } else {
    console.log('check provided data fields');
    // not all data was supplied
    // have generic error page
  }

  // User.findOne({ username: req.body.username }, async (err, doc) => {
  //   if (err) throw err;
  //   if (doc) {
  //     res.send('Username already exists.');
  //   }
  //   if (!doc) {
  //     const hashedPassword = await bcrypt.hash(req.body.password, 10);
  //     const newUser = new User({
  //       username: req.body.username,
  //       password: hashedPassword,
  //     });

  //     await newUser.save();
  //     res.send(newUser);
  //   }
  // });
});

module.exports = router;
