const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');

router.post('/', async (req, res, next) => {
  if (!req.body.users) {
    console.log('no users sent to create chat with');
    return res.sendStatus(400);
  }

  const users = JSON.parse(req.body.users);

  if (users.length === 0) {
    console.log('empty chat users array');
    res.sendStatus(400);
  }

  // add the current user to the chat
  users.push(req.user);

  const chatData = {
    users: users,
    isGroupChat: true,
  };
  Chat.create(chatData)
    .then((chat) => {
      res.status(200).send(chat);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.get('/', (req, res, next) => {
  Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate('users')
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

module.exports = router;
