const express = require('express');
const app = express();
const router = express.Router();
const User = require('../models/UserSchema');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');

router.post('/', async (req, res) => {
  // im not returning these errors since everything is validated client side.
  // just using it to escape. Although if this was a real app i would double check properly.
  body('firstName', '').trim().escape();
  body('lastName', '').trim().escape();
  body('username', '').trim().escape();
  body('email', '').trim().escape();
  body('password', '').escape();

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const fullName = `${req.body.firstName} ${req.body.lastName}`;

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
        fullName,
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
