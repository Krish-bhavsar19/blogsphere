const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { user } = require('../Model/user'); // import your User model
const passport=require('passport');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL

  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user with this email already exists
      const existingUser = await user.findOne({ email: profile.emails[0].value });

      if (existingUser) {
        return done(null, existingUser);
      }

      // Create new user
      const newUser = await user.create({
        username: profile.displayName,
        email: profile.emails[0].value,
        profileImageURL: profile.photos[0].value,
        isGoogleUser: true  // optional
      });

      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }
));


module.exports = passport;
