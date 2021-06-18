const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Notification = require('../../models/NotificationSchema');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const uniqid = require('uniqid');

const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

// const upload = multer({ dest: 'uploads/' });

const S3 = new AWS.S3();

const storage = multer.memoryStorage({
  destination: (req, file, callback) => {
    callback(null, '');
  },
});

const upload = multer({
  storage: storage,
  limits: 5 * 1024 * 1024,
  dest: 'uploads/',
}).single('image');

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

  // only send notification if we are following a user. not unfollowing
  if (!isFollowing) {
    await Notification.insertNotification(userId, req.user._id, 'follow', req.user._id);
  }

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

router.post('/profilePicture', upload, async (req, res, next) => {
  if (!req.file) {
    console.log('no profile image uploaded');
    return res.sendStatus(400);
  }

  const imageId = uniqid();

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `${imageId}.png`,
    Body: req.file.buffer,
    ACL: 'public-read',
  };
  S3.upload(params, async (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      console.log('upload');
      req.user = await User.findByIdAndUpdate(
        req.user._id,
        {
          profilePic: {
            url: data.Location,
            id: imageId,
          },
        },
        { new: true }
      );

      res.status(200).send(req.user);
    }
  });

  // // const filePath = `/uploads/images/${req.file.filename}.png`;
  // const filePath = `/public/images/userImages/${req.file.filename}.png`;
  // const clientPath = `/images/userImages/${req.file.filename}.png`;
  // const tempPath = req.file.path;
  // const targetPath = path.join(__dirname, `../../${filePath}`);

  // fs.rename(tempPath, targetPath, async (error) => {
  //   if (error !== null) {
  //     console.log(error);
  //     return res.sendStatus(400);
  //   }

  //   req.user = await User.findByIdAndUpdate(
  //     req.user._id,
  //     { profilePic: clientPath },
  //     { new: true }
  //   );

  //   res.status(200).send(req.user);
  // });
});

router.post('/coverPhoto', upload, async (req, res, next) => {
  if (!req.file) {
    console.log('no profile image uploaded');
    return res.sendStatus(400);
  }

  const imageId = uniqid();

  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `${imageId}.png`,
    Body: req.file.buffer,
    ACL: 'public-read',
  };
  S3.upload(params, async (err, data) => {
    if (err) {
      console.log(err);
      res.sendStatus(400);
    } else {
      console.log('upload');
      req.user = await User.findByIdAndUpdate(
        req.user._id,
        {
          coverPhoto: {
            url: data.Location,
            id: imageId,
          },
        },
        { new: true }
      );

      res.status(200).send(req.user);
    }
  });
});

router.put('/description', async (req, res, next) => {
  body('description', '').trim().escape();
  const description = req.body.description;

  req.user = await User.findByIdAndUpdate(
    req.user._id,
    { description: description },
    { new: true }
  );

  res.status(200).send(req.user);
});

router.put('/shop/:numCoins', async (req, res, next) => {
  const userId = req.params.userId;
  const numCoins = req.params.numCoins;

  req.user = await User.findByIdAndUpdate(req.user.id, { coins: numCoins }, { new: true });

  res.status(200).send(req.user);
});

// returns follow suggestions for the logged in user
router.get('/suggestions', async (req, res, next) => {
  const userId = req.user._id;
  const alreadyFollowing = [...req.user.following, userId];

  const followSuggestions = await User.find({ _id: { $nin: alreadyFollowing } });

  res.status(200).send(followSuggestions);
});

module.exports = router;
