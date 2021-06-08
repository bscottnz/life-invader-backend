const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');
const Message = require('../../models/MessageSchema');

router.get('/', async (req, res, next) => {
  res.send('Inbox page');
});

router.get('/new', async (req, res, next) => {
  res.send('New Message');
});

router.post('/', (req, res, next) => {
  if (!req.body.content || !req.body.chatId) {
    console.log('content or id not sent with create message request');
    return res.sendStatus(400);
  }

  const newMessage = {
    sender: req.user._id,
    content: req.body.content,
    chat: req.body.chatId,
  };

  Message.create(newMessage)
    .then((results) => {
      res.status(201).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

module.exports = router;
