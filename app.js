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
const notificationsApiRoute = require('./routes/api/notifications');

// middleware -------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: 'beniscool',
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
      secure: process.env.NODE_ENV === 'production', // must be true if sameSite='none'
    },
  })
);

app.use(cookieParser('beniscool'));
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passportConfig')(passport);

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  );
  next();
});

app.set('trust proxy', 1);

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
app.use('/api/notifications', middleware.requireLogin, notificationsApiRoute);

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

// set up socket connection

app.io.on('connection', (socket) => {
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join room', (room) => {
    socket.join(room);
  });

  socket.on('typing', (room) => {
    socket.in(room).emit('typing', room);
  });

  socket.on('stop typing', (room) => {
    socket.in(room).emit('stop typing');
  });

  socket.on('notification received', (room) => {
    socket.in(room).emit('notification received');
  });

  socket.on('new message', (newMessage) => {
    const chat = newMessage.chat;

    console.log('message sent via socket');

    if (!chat.users) {
      return console.log('no chat users for socket message');
    }

    chat.users.forEach((user) => {
      if (user._id === newMessage.sender._id) {
        // dont send message to ourselves
        return;
      }

      socket.in(user._id).emit('message recieved', newMessage);
    });
  });
});

module.exports = app;
