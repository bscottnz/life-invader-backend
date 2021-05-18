const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pinned: Boolean,
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharedPostData: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
