const express = require('express');
const app = express();
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/', (req, res) => {
  User.findOne({ username: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) {
      res.send('Username already exists.');
    }
    if (!doc) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
      });

      await newUser.save();
      res.send(newUser);
    }
  });
});

module.exports = router;
