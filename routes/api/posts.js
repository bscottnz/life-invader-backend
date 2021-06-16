const express = require('express');
const app = express();
const router = express.Router();
const { body } = require('express-validator');
const User = require('../../models/UserSchema');
const Post = require('../../models/PostSchema');
const Notification = require('../../models/NotificationSchema');

router.get('/', async (req, res, next) => {
  const searchObj = req.query;

  // in case the user has no following array
  if (!req.user.following) {
    req.user.following = [];
  }

  // if only want to return post by users we are following
  if (searchObj.followingPostsOnly !== undefined) {
    const followingPostsOnly = searchObj.followingPostsOnly == 'true';

    // dont want to limit posts if the param was set to false
    if (followingPostsOnly) {
      // ids of users the logged in user is following
      const followingIds = [...req.user.following];

      // add own id to array
      followingIds.push(req.user._id);

      // only return posts by ids in followingIds
      searchObj.author = { $in: followingIds };
    }

    // delete following only ajax param
    delete searchObj.followingPostsOnly;
  }

  let posts = await getPosts(searchObj);

  res.status(200).send(posts);
});

router.get('/:id', async (req, res, next) => {
  const postId = req.params.id;
  const posts = await getPosts({ _id: postId });

  // if the post was found and no error
  if (posts && posts.length > 0) {
    // will only contain 1 results
    const post = posts[0];

    const results = {
      post: post,
    };

    // check to see if the post is a reply, if so get the post it is
    // replying to
    if (post.replyTo !== undefined) {
      results.replyTo = post.replyTo;

      // if the post we are replying to is replying to another post, get that post data
      // so we can display who that post is replying to.
      // this is some inception level shit
      if (post.replyTo !== null && post.replyTo.replyTo !== undefined) {
        results.replyTo = await Post.populate(results.replyTo, { path: 'replyTo' });

        results.replyTo.replyTo = await User.populate(results.replyTo.replyTo, { path: 'author' });
      }

      // populate the replies to this post
      results.replyTo = await Post.populate(results.replyTo, {
        path: 'replies',
        model: 'Post',
      });
    }
    // get all replies to the post
    results.replies = await getPosts({ replyTo: postId });

    res.status(200).send(results);
  } else {
    res.sendStatus(400);
  }
});

router.post('/', async (req, res, next) => {
  if (!req.body.content) {
    console.log('no content sent with post post request');
    return res.sendStatus(400);
  }

  //  i realised this doesnt actually do anything and needs to be declared as middleware
  // before the async(req, res, next), but i also reaslied react escapes things anyway
  // and adding this to the middleware will double escape text on the front end.
  body('content', '').trim().escape();

  const postData = {
    content: req.body.content,
    author: req.user,
  };

  // add reply to field if the post is a reply
  if (req.body.replyTo) {
    postData.replyTo = req.body.replyTo;
  }

  // if i restart server and try to make a post, it crashes every reload
  // since the post was sent to db with no user property.
  if (postData.author === undefined) {
    return res.sendStatus(400);
  }

  let post;

  await Post.create(postData)
    .then(async (newPost) => {
      post = newPost;
      newPost = await User.populate(newPost, { path: 'author' });
      // console.log(newPost);

      // populate relevent info if the post is a reply, so the reply
      // can be appended to dom by the front end immediatley
      if (newPost.replyTo) {
        newPost = await Post.populate(newPost, { path: 'replyTo' });
        newPost = await User.populate(newPost, { path: 'replyTo.author' });
      }

      // send notification on reply
      if (newPost.replyTo !== undefined) {
        // dont give reply to self notification
        if (newPost.replyTo.author._id.toString() !== req.user._id.toString()) {
          await Notification.insertNotification(
            newPost.replyTo.author._id,
            req.user._id,
            'reply',
            newPost._id
          );
        }
      }

      res.status(201).send(newPost);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });

  // if the newly created post was a reply, add it to the replies array of the post
  // it was replying to.
  if (req.body.replyTo) {
    await Post.findByIdAndUpdate(
      req.body.replyTo,
      { $addToSet: { replies: post._id } },
      { new: true }
    );
  }
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

  // only send notif on a like. not a dislike. do not send notification for disliking own post
  if (!isLiked && post.author.toString() !== req.user._id.toString()) {
    await Notification.insertNotification(post.author, req.user._id, 'like', post._id);
  }

  res.status(200).send(post);
});

router.post('/:id/share', async (req, res, next) => {
  // make sure a logged in user is sending this request
  if (req.user === undefined) {
    return res.sendStatus(400);
  }

  const postId = req.params.id;
  const userId = req.user._id;

  // try to delete shared post. if it can be deleted, it has been un-shared.
  // if it cant delete it, then it will share the post
  const deletedPost = await Post.findOneAndDelete({ author: userId, sharedPostData: postId }).catch(
    (err) => {
      console.log(err);
      res.sendStatus(400);
    }
  );

  // create relevent db operator that either adds or removes post from
  // users dislike array
  const option = deletedPost != null ? '$pull' : '$addToSet';

  let repost = deletedPost;

  // create post
  if (repost == null) {
    repost = await Post.create({ author: userId, sharedPostData: postId }).catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
  }

  // insert user shared post
  req.user = await User.findByIdAndUpdate(
    userId,
    { [option]: { shares: repost._id } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  // insert post shared by user
  const post = await Post.findByIdAndUpdate(
    postId,
    { [option]: { sharedBy: userId } },
    { new: true }
  ).catch((err) => {
    console.log(err);
    res.sendStatus(400);
  });

  // populate the repost orignal info so can update the front end without having to refresh
  repost = await Post.populate(repost, { path: 'sharedPostData' });
  repost = await Post.populate(repost, { path: 'sharedPostData.author' });
  repost = await User.populate(repost, { path: 'author' });

  // only send notif on share, not un-share. no notification for share own post
  if (!deletedPost && post.author.toString() !== req.user._id.toString()) {
    await Notification.insertNotification(post.author, req.user._id, 'share', post._id);
  }

  res.status(200).send({ post, repost, option });
});

router.delete('/:id', async (req, res, next) => {
  // get the post we are deleting, so we can see what post it is replying to, if any,
  // and delete it from that posts array of replies
  const toDelete = await Post.findById(req.params.id);

  if (toDelete.replyTo) {
    await Post.findByIdAndUpdate(
      toDelete.replyTo,
      { $pull: { replies: req.params.id } },
      { new: true }
    );
  }

  // delete the post and any posts that shared the deleted post
  Post.deleteMany(
    { $or: [{ sharedPostData: req.params.id }, { _id: req.params.id }] },
    function (err, result) {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.sendStatus(202);
      }
    }
  );
});

router.put('/:id', async (req, res, next) => {
  const query = req.body;
  const postId = req.params.id;

  // incase i later want to use this route to make other edits, make sure the
  // pined option was sent with the request
  if (req.body.pinned !== undefined) {
    // await Post.updateMany({ author: req.user._id }, { pinned: false }).catch((err) => {
    await Post.findOneAndUpdate({ author: req.user._id, pinned: true }, { pinned: false }).catch(
      (err) => {
        console.log(err);
        return res.sendStatus(400);
      }
    );
  }

  Post.findByIdAndUpdate(postId, query)
    .then(() => res.sendStatus(200))
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
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
