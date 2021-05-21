const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.put('/:userId/follow', (req, res, next) => {
  res.send('hello');
});

module.exports = router;
