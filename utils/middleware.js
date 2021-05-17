exports.requireLogin = (req, res, next) => {
  if (req.isAuthenticated) {
    if (req.user === undefined) {
      return res.sendStatus(401);
    }

    return next();
  } else {
    return res.sendStatus(401);
  }
};
