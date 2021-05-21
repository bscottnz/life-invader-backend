const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.put('/:userId/follow', async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);

  if (user === null) {
    return res.sendStatus(404);
  }

  // check to see if the logged in user is following this user
  const isFollowing = user.followers && user.followers.includes(req.user._id);

  const option = isFollowing ? '$pull' : '$addToSet';

  // insert followed user into logged in users following array
  req.user = await User.findByIdAndUpdate(
    req.user._id,
    { [option]: { following: userId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  // insert logged in user in to the followed users followers array
  User.findByIdAndUpdate(userId, { [option]: { followers: req.user._id } }, { new: true }).catch(
    (err) => {
      console.log(err);
      res.sendStatus(400);
    }
  );

  res.send(req.user);
});

module.exports = router;
