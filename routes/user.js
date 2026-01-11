const { Router } = require("express");
const { randomBytes, createHmac } = require("crypto");
const { user } = require("../Model/user");
const { Post } = require("../Model/post");
const { setUser, getUser } = require('../service/auth');
const router = Router();
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router
  .get("/signup", (req, res) => res.render("signup"))
  .post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
      const existingUser = await user.findOne({ email });
      if (existingUser) {
        return res.render("signup", {
          error: "Email is already registered."
        });
      }

      const salt = randomBytes(16).toString("hex");
      const hashedPassword = createHmac("sha256", salt).update(password).digest("hex");

      await user.create({
        username,
        password: hashedPassword,
        email,
        salt
      });

      return res.redirect('/login');
    } catch (err) {
      console.error("Signup error:", err);
      return res.status(500).send("Something went wrong. Please try again.");
    }
  })
  .get('/login', (req, res) => {
    const redirect = req.query.redirect || '/';
    res.render('login', { redirect, error: null });
  })

  .post('/login', async (req, res) => {
    const { password, email, redirect } = req.body;
    const redirectPath = redirect || '/';
    try {
      const foundUser = await user.matchPassword(email, password);
      const token = setUser(foundUser);
      res.cookie("uid", token, { httpOnly: true });

      return res.redirect(redirectPath);
      // return res.redirect('/');
    } catch (err) {
      console.error("Login error:", err.message);
      res.render("login", {
        error: "Invalid email or password"
      });
    }
  })
  .get("/logout", (req, res) => {
    res.clearCookie("uid", { path: "/" });
    res.send(`
    <script>
      sessionStorage.removeItem('welcomePopupShown');
      window.location.href = "/";
    <\/script>
  `);
  })

  .get("/dashboard", async (req, res) => {
    const token = req.cookies.uid;
    const userData = getUser(token);
    if (!userData) {
      return res.redirect("/user/login");
    }

    try {
      const currentUser = await user.findById(userData._id);

      const posts = await Post.find({ author: currentUser._id })
        .populate('author', 'username profileImageURL')
        .sort({ createdAt: -1 });

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
      res.render("dashboard", {
        user: currentUser,
        posts: posts,
        totalPosts,
        totalLikes,
        totalComments
      });
    } catch (err) {
      res.redirect("/user/login");
    }
  })

router.get('/profile', async (req, res) => {
  if (!req.user) return res.redirect('/user/login');
  res.render('profile');
});

router.post('/profile', upload.single('profileImage'), async (req, res) => {
  if (!req.user) return res.redirect('/user/login');
  const { username, email } = req.body;
  let error = null;

  if (email && email !== req.user.email) {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      error = 'Email is already registered.';
    }
  }

  if (!error) {
    if (username) req.user.username = username;
    if (email && email !== req.user.email) req.user.email = email;
    if (req.file) {
      req.user.profileImageURL = `/images/${req.file.filename}`;
    }
    await req.user.save();
    return res.redirect('/user/dashboard');
  } else {
    return res.render('profile', {error });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  req.user.notifications.forEach(n => n.read = true);
  await req.user.save();
  res.json({ success: true });
});

// Get all notifications (for dropdown or notifications page)
router.get('/notifications', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ notifications: req.user.notifications });
});

//resetpassword

router.get('/forgot-password', (req, res) => {
  const { success, error } = req.query;
  res.render('forgot-password', { success, error });
});


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const foundUser = await user.findOne({ email });
    if (!foundUser) {
      return res.render('forgot-password', {
        error: 'User with this email not found',
        success: null
      });
    }


    if (foundUser.isGoogleUser && !foundUser.password) {
      return res.render('forgot-password', {
        error: 'This account was created using Google login. Use Google to sign in.',
        success: null
      });
    }

    // Generate and save reset token
    const token = randomBytes(32).toString('hex');
    foundUser.resetPasswordToken = token;
    foundUser.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
    await foundUser.save();

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter connection
    await transporter.verify().catch(err => {
      throw new Error('Email server connection failed');
    });

    // Send email and capture detailed response
    const mailResponse = await transporter.sendMail({
      to: foundUser.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Link',
      html: `
    <p>You requested a password reset.</p>
    <p>
      Click <a href="https://blogsphere-3e6g.onrender.com/user/reset-password/${token}">
      here</a> to reset your password. This link expires in 5 minutes.
    </p>  
  `
    });



    // Check if email was accepted and has a valid response
    if (mailResponse.accepted.includes(foundUser.email) && mailResponse.response.includes('OK')) {
      return res.redirect('/user/forgot-password?success=Check your email, a message has been sent');

    } else {
      throw new Error('Email was not successfully delivered');
    }
  } catch (err) {
    return res.render('forgot-password', {
      error: 'Failed to send reset email. Please try again.',
      success: null
    });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { password, cmpassword } = req.body;

  if (password !== cmpassword) {
    return res.render('reset-password', {
      token: req.params.token,
      error: 'Passwords do not match'
    });
  }

  try {
    const foundUser = await user.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!foundUser) return res.status(400).json({ msg: 'Invalid or expired token' });

    const newSalt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac("sha256", newSalt)
      .update(password)
      .digest("hex");

    foundUser.password = hashedPassword;
    foundUser.salt = newSalt;
    foundUser.resetPasswordToken = undefined;
    foundUser.resetPasswordExpires = undefined;

    await foundUser.save();

    res.render('login', { msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
});


router.get('/reset-password/:token', async (req, res) => {
  const token = req.params.token;

  try {
    const foundUser = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!foundUser) {
      return res.send("Password reset token is invalid or has expired.");
    }

    res.render('reset-password', { token });
  } catch (err) {
    res.send("Something went wrong.");
  }
});



module.exports = router;
