const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema(
  {
    username: { type: String },
    date: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Login', LoginSchema);
