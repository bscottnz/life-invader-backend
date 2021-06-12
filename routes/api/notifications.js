const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Chat = require('../../models/ChatSchema');
const Message = require('../../models/MessageSchema');
const Notification = require('../../models/NotificationSchema');

router.get('/', (req, res, next) => {
  Notification.find({
    userTo: req.user._id,
    notificationType: { $ne: 'message' },
  })
    .populate('userTo')
    .populate('userFrom')
    .sort({ createdAt: -1 })
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.put('/:id/read', (req, res, next) => {
  Notification.findByIdAndUpdate(req.params.id, { read: true })
    .then(() => res.sendStatus(204))
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.put('/read', (req, res, next) => {
  Notification.updateMany({ userTo: req.user._id }, { read: true })
    .then(() => res.sendStatus(204))
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

module.exports = router;
