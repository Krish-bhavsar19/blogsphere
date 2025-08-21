const express = require('express');
const passport=require('../config/passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/google',
  (req, res, next) => {
    console.log("Redirect URI being used:", process.env.GOOGLE_CALLBACK_URL);
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Convert to plain JS object
    const userPayload = {
      _id: req.user._id,
      email: req.user.email,
      username: req.user.username
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('uid', token, { httpOnly: true });
    res.redirect('/');
  }
);


module.exports = router;
