const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema(
  {
    userName: { type: String },
    date: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Login', LoginSchema);
