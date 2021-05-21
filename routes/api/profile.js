const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.get('/:username', async (req, res, next) => {
  const username = req.params.username;

  const user = await User.findOne({ username: username });

  if (user == null) {
    return res.sendStatus(404);
  } else {
    return res.send(user);
  }
});

module.exports = router;
