require('dotenv').config();

const { connectmongo } = require("./connection");
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const cookieParser = require('cookie-parser');
const { checkAuth } = require("./middleware/auth");
const staticRouter = require("./routes/staticRouter");
const app = express();

const { user } = require('./Model/user');
const { Post } = require('./Model/post');
const { getUser } = require('./service/auth');

const PORT = process.env.PORT || 8000;

const passport = require('passport');
require('./config/passport');

const authGoogleRoutes = require('./routes/authgoogle');
app.use('/auth', authGoogleRoutes);

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.set("trust proxy", true);
app.set("view engine", "ejs");
app.set("views", path.resolve("./view"));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(cookieParser());
app.use(checkAuth);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get("/", async (req, res) => {
  try {
    const token = req.cookies.uid;
    const userData = getUser(token);
    let currentUser = null;

    if (userData) {
      currentUser = await user.findById(userData._id);
    }

    // Get recent posts (featured posts)
    const posts = await Post.find({ isPublished: true })
      .populate('author', 'username profileImageURL')
      .sort({ createdAt: -1 })
      .limit(6);

    // Get all posts for categorization
    const allPosts = await Post.find({ isPublished: true })
      .populate('author', 'username profileImageURL')
      .sort({ createdAt: -1 });

    const categories = {};
    allPosts.forEach(post => {
      const cat = post.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(post);
    });

    const featuredPostIds = posts.map(post => post._id.toString());
    const trendingPostDocs = await Post.aggregate([
      {
        $match: {
          isPublished: true,
          _id: { $nin: featuredPostIds }
        }
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } }
        }
      },
      {
        $sort: { likesCount: -1, createdAt: -1 }
      },
      {
        $limit: 6
      },
      {
        $project: { _id: 1 }
      }
    ]);

    const trendingIds = trendingPostDocs.map(doc => doc._id);

    let trendingPosts = await Post.find({
      _id: { $in: trendingIds }
    }).populate('author', 'username profileImageURL');

    const idOrder = {};
    trendingIds.forEach((id, i) => idOrder[id.toString()] = i);

    trendingPosts = trendingPosts.sort((a, b) =>
      idOrder[a._id.toString()] - idOrder[b._id.toString()]
    );



    res.render("home", {
      user: currentUser,
      posts,
      categories,
      trendingPosts
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render("home", {
      user: null,
      posts: [],
      categories: {},
      trendingPosts: []
    });
  }
});

app.use("/user", userRoutes);
app.use("/posts", postRoutes);
app.use("/", staticRouter);

connectmongo(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });