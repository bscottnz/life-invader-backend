const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');

router.get('/', async (req, res, next) => {
  res.send('Inbox page');
});

router.get('/new', async (req, res, next) => {
  res.send('New Message');
});

module.exports = router;
