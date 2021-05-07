const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.get('/', (req, res, next) => {
  Post.find()
    .populate('author')
    .sort({ createdAt: -1 })
    .then((posts) => {
      res.status(200).send(posts);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('no content sent with post post request');
    return res.sendStatus(400);
  }

  const postData = {
    content: req.body.content,
    author: req.user,
  };

  // if i restart server and try to make a post, it crashes every reload
  // since the post was sent to db with no user property.
  if (postData.author === undefined) {
    return res.sendStatus(400);
  }

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

router.put('/:id/dislike', async (req, res, next) => {
  // make sure a logged in user is sending this request
  if (req.user === undefined) {
    return res.sendStatus(400);
  }

  const postId = req.params.id;
  const userId = req.user._id;

  // check if user has a dislikes feild, if so check if it contains the post id
  const isLiked = req.user.dislikes && req.user.dislikes.includes(postId);

  // create relevent db operator that either adds or removes post from
  // users dislike array
  const option = isLiked ? '$pull' : '$addToSet';

  // insert user dislike
  req.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { dislikes: postId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  // insert post dislike
  const post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { dislikes: userId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  res.status(200).send(post);
});

module.exports = router;
