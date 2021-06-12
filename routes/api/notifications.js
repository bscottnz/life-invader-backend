const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');
const Message = require('../../models/MessageSchema');

router.get('/', (req, res, next) => {
  res.send('hello');
});

module.exports = router;
