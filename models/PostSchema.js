const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    content: { type: String, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pinned: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
