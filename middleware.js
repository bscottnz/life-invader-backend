exports.requireLogin = (req, res, next) => {
  // will need to re write this to use passport maybe. is autheticated or somethign like that
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.send('log in to access this data');
    // what ever i return here, the front end will need to log out its user and redirect to home page.
    // the front end keeps track of logged in user anyway but just incase the server session ends when
    // the front end doesnt know about it, i need to check.
  }
};
