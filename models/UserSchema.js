const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: '/images/profilePic.jpg',
    },
    coverPhoto: {
      type: String,
    },
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    goldenName: Boolean,
    admin: Boolean,
    description: { type: String, trim: true },
    coins: { type: Number, default: 2 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
