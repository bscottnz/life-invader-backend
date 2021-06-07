const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');

router.get('/', async (req, res, next) => {
  const searchObj = req.query;
  console.log(searchObj);

  const posts = await getPosts({ content: { $regex: searchObj.search, $options: 'i' } });
  const users = await User.find({
    $or: [
      { firstName: { $regex: searchObj.search, $options: 'i' } },
      { lastName: { $regex: searchObj.search, $options: 'i' } },
      { fullName: { $regex: searchObj.search, $options: 'i' } },
      { userName: { $regex: searchObj.search, $options: 'i' } },
    ],
  }).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  const results = { posts, users };

  res.send(results);
});

async function getPosts(filter = {}) {
  let posts = await Post.find(filter)
    .populate('author')
    .populate('sharedPostData')
    .populate('replyTo')
    .populate('replies')

    .sort({ createdAt: -1 })
    .catch((err) => {
      console.log(err);
    });

  // there has to be a more efficient way to do all these queries
  posts = await User.populate(posts, { path: 'replyTo.author' });
  // this took me a while to figure out, needing to add the model to correctly populate an array
  posts = await Post.populate(posts, { path: 'sharedPostData.replies', model: 'Post' });
  return await User.populate(posts, { path: 'sharedPostData.author' });
}

module.exports = router;
