const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

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

router.get('/:username/followers', (req, res, next) => {
  User.findOne({ username: req.params.username })
    .populate('followers')
    .populate('following')
    .then((results) => {
      res.status(200).send(results);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

router.post('/profilePicture', upload.single('profilePic'), async (req, res, next) => {
  if (!req.file) {
    console.log('no profile image uploaded');
    return res.sendStatus(400);
  }

  // const filePath = `/uploads/images/${req.file.filename}.png`;
  const filePath = `/public/images/userImages/${req.file.filename}.png`;
  const clientPath = `/images/userImages/${req.file.filename}.png`;
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, `../../${filePath}`);

  fs.rename(tempPath, targetPath, async (error) => {
    if (error !== null) {
      console.log(error);
      return res.sendStatus(400);
    }

    req.user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: clientPath },
      { new: true }
    );

    res.status(200).send(req.user);
  });
});

module.exports = router;
