const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

// i will move these
const User = require('./models/User');

mongoose.connect(
  'mongodb+srv://ben:12345@cluster0.erh69.mongodb.net/life-invader?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log('Database connected');
  }
);

// routes imports
const indexRouter = require('./routes/index');

const app = express();

// middleware
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
require('./passportConfig')(passport);

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

// routes

app.use('/', indexRouter);
app.get('/ben', (req, res) => {
  res.json({ title: 'test' });
});
app.post('/ben', (req, res) => {
  console.log(req.body);
  res.json({ title: 'post' });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) throw err;

    if (!user) res.send('Wrong username or password');
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send('Successfully Authenticated');
      });
    }
  })(req, res, next);
});

app.post('/register', (req, res) => {
  User.findOne({ username: req.body.username }, async (err, doc) => {
    if (err) throw err;
    if (doc) {
      res.send('user already exists');
    }
    if (!doc) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
      });

      await newUser.save();
      res.send('user created');
    }
  });
});

app.get('/user', (req, res) => {
  res.send(req.user);
});

app.get('/logout', (req, res) => {
  console.log(req.user);
  req.logout();
  console.log(req.user);
  res.send('logging owt');
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
