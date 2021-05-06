const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('no content sent with post post request');
    return res.sendStatus(400);
  }

  const postData = {
    content: req.body.content,
    author: req.user,
  };

  Post.create(postData)
    .then(async (newPost) => {
      newPost = await User.populate(newPost, { path: 'author' });
      console.log(newPost);
      res.status(201).send(newPost);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

module.exports = router;
