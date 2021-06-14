const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const { body, trim, escape } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');
const Message = require('../../models/MessageSchema');

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
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      if (req.query.unreadOnly !== undefined && req.query.unreadOnly == 'true') {
        // only send unread messages
        results = results.filter(
          (msg) => msg.lastMessage && !msg.lastMessage.seenBy.includes(req.user._id)
        );
      }

      results = await User.populate(results, { path: 'lastMessage.sender' });
      res.status(200).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.get('/:chatId', async (req, res, next) => {
  const chatId = req.params.chatId;
  const userId = req.user._id;

  const isvalidId = mongoose.isValidObjectId(chatId);

  // make sure a random chat id hasnt been typed into the address bar
  if (!isvalidId) {
    return res.sendStatus(400);
  }

  // make sure we cant access a chat that we are not a part of
  let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } }).populate(
    'users'
  );

  if (chat == null) {
    // check if the chat id is actually a user id (for direct messages that arent group chats)
    const userFound = await User.findById(chatId);

    if (userFound != null) {
      // get chat using user id
      chat = await getChatByUserId(userId, userFound._id);
    } else {
      return res.sendStatus(400);
    }
  }

  if (chat == null) {
    // no chat found
    return res.sendStatus(400);
  }

  res.status(200).send({ chat: chat });
});

router.get('/:chatId/messages', async (req, res, next) => {
  const chatId = req.params.chatId;
  Message.find({ chat: chatId })
    .populate('sender')
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

function getChatByUserId(currentUserId, otherUserId) {
  return Chat.findOneAndUpdate(
    {
      isGroupChat: false,
      users: {
        $size: 2,
        $all: [
          { $elemMatch: { $eq: mongoose.Types.ObjectId(currentUserId) } },
          { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } },
        ],
      },
    },
    {
      $setOnInsert: {
        users: [currentUserId, otherUserId],
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).populate('users');
}

router.put('/:chatId', (req, res, next) => {
  Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.put('/:chatId/messages/read', async (req, res, next) => {
  const chatId = req.params.chatId;
  Message.updateMany({ chat: chatId }, { $addToSet: { seenBy: req.user._id } })
    .then(() => {
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

module.exports = router;
