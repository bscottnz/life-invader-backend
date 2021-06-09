const createError = require('http-errors');
const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const middleware = require('./utils/middleware');

app.io = require('socket.io')();

const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const connectDb = require('./utils/connectDb');
connectDb();

// route imports ----------------------------------------------------------

const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');

const postsApiRoute = require('./routes/api/posts');
const profileApiRoute = require('./routes/api/profile');
const usersApiRoute = require('./routes/api/users');
const searchApiRoute = require('./routes/api/search');
const messagesApiRoute = require('./routes/api/messages');
const chatsApiRoute = require('./routes/api/chats');

// middleware -------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(
  session({
    secret: 'beniscool',
    resave: true,
    saveUninitialized: true,
  })
);

app.use(cookieParser('beniscool'));
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passportConfig')(passport);

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

// routes -----------------------------------------------------------------

app.use('/login', loginRoute);
app.use('/register', registerRoute);

// app.use(middleware.requireLogin);

app.use('/api/posts', middleware.requireLogin, postsApiRoute);
app.use('/api/profile', middleware.requireLogin, profileApiRoute);
app.use('/api/users', middleware.requireLogin, usersApiRoute);
app.use('/api/search', middleware.requireLogin, searchApiRoute);
app.use('/api/messages', middleware.requireLogin, messagesApiRoute);
app.use('/api/chats', middleware.requireLogin, chatsApiRoute);

app.get('/logout', (req, res) => {
  console.log(req.user);
  req.logout();
  console.log(req.user);
  res.send('logging owt');
});

// returns user data to make sure there is a logged in user
app.get('/authenticate', (req, res, next) => {
  res.send(req.user);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
