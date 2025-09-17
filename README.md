
# BlogSphere — Your Words. Your World. Your BlogSphere.

BlogSphere is a full‑featured blogging platform built with Node.js, Express, EJS, and MongoDB. It supports local email/password authentication and Google OAuth, post creation with Cloudinary image uploads, likes, comments, notifications, categories, tags, search, and a personal dashboard.

If you’re looking for a clean, extensible starting point for a blog application, this repo provides a complete flow from auth to content management and rendering.

— Live demo (optional): https://blogsphere-3e6g.onrender.com


## Features
- Authentication: Local login/signup with JWT (httpOnly cookie), Google OAuth 2.0 via Passport.
- Profile: Update username, email, and avatar (image uploaded to `public/images`).
- Posts: Create, edit, delete posts with categories, tags, and hero images stored on Cloudinary.
- Social: Like/unlike, comment on posts; author receives in‑app notifications (likes/comments).
- Discovery: Home with featured + trending posts, category pages, and search.
- Dashboard: Per‑user dashboard summarizing posts, likes, and comments.
- Server‑side rendering: EJS templates with partials and static assets.


## Tech Stack
- Backend: Node.js, Express 5, MongoDB (Mongoose 8)
- Auth: JWT (cookie), Passport Google OAuth 2.0
- Views: EJS templates + CSS/JS in `public/`
- Uploads: Multer + `multer-storage-cloudinary` (Cloudinary)
- Email: Nodemailer (Gmail)


## Project Structure
connection.js
Index.js
package.json
config/
	passport.js
middleware/
	auth.js
Model/
	post.js
	user.js
public/
	images/
	script/
	style/
routes/
	authgoogle.js
	post.js
	staticRouter.js
	user.js
service/
	auth.js
view/
	*.ejs + partials/



## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A MongoDB connection string (MongoDB Atlas recommended)
- Cloudinary account (for post image uploads)
- Gmail account with App Passwords (for password reset emails)

### Installation
```cmd
git clone <https://github.com/Krish-bhavsar19/blogsphere>
cd "Blog Platform"
npm install
```

Create a `.env` file in the project root:

Run the app in development mode (with auto‑reload):

```cmd
npm run dev
```

Or run normally:
```cmd
npm start
```
Visit: http://localhost:8000


## How It Works
- `Index.js` bootstraps Express, connects to MongoDB, sets EJS, parses cookies/body, serves static files, and wires routes.
- `service/auth.js` issues and verifies JWTs; tokens are stored in an httpOnly cookie named `uid`.
- Local auth: passwords are salted and hashed using HMAC‑SHA256 (see `Model/user.js`).
- Google OAuth: configured via `config/passport.js`, with routes in `routes/authgoogle.js`.
- Posts: images are uploaded to Cloudinary via `multer-storage-cloudinary` in `routes/post.js`.
- Views: server‑rendered EJS templates live under `view/` with reusable partials.


## Key Routes
Authentication & Profile
- `GET /user/signup` — Render signup page
- `POST /user/signup` — Create account (email, username, password)
- `GET /user/login` — Render login page
- `POST /user/login` — Login and set `uid` cookie
- `GET /user/logout` — Clear auth cookie and redirect
- `GET /auth/google` — Start Google OAuth
- `GET /auth/google/callback` — Handle Google callback, set `uid`
- `GET /user/profile` — Profile page (requires login)
- `POST /user/profile` — Update username/email/avatar (multipart `profileImage`)

Password Reset
- `GET /user/forgot-password` — Request reset link
- `POST /user/forgot-password` — Send email with token (expires in 5 minutes)
- `GET /user/reset-password/:token` — Render reset form
- `POST /user/reset-password/:token` — Save new password

Posts
- `POST /posts/create` — Create post (requires login; fields: `title`, `content`, `category`, `tags`, `image`)
- `GET /posts/:id` — Read a post
- `GET /posts/:id/edit` — Edit form (author only)
- `POST /posts/:id/edit` — Update post (multipart `image` optional)
- `POST /posts/:id/delete` — Delete post (author only)
- `POST /posts/:id/like` — Like/unlike (JSON response)
- `POST /posts/:id/comments` — Add a comment
- `GET /category/:categoryName` — Posts by category

Pages & Discovery
- `GET /` — Home (featured + trending, categories)
- `GET /user/dashboard` — Your posts, stats
- `GET /search?q=<term>` — Search posts by title/content/category
- `GET /allposts` — All posts page


## Forms & Payloads
Create/Update Post (multipart/form-data):
- `title`: string (required)
- `content`: string (required)
- `category`: one of `Technology | Lifestyle | Travel | Food | General`
- `tags`: comma‑separated string (e.g., `nodejs, web, express`)
- `image`: file input (optional; uploaded to Cloudinary)

Profile Update (multipart/form-data):
- `username`: string
- `email`: string
- `profileImage`: file input (optional; stored in `public/images`)


## Environment & Services
- MongoDB: `MONGO_URI` is read in `Index.js` by `connectmongo` (`connection.js`).
- JWT: `JWT_SECRET` used in `service/auth.js` for signing/verifying.
- Google OAuth: `GOOGLE_*` used in `config/passport.js`.
- Cloudinary: `CLOUDINARY_*` used in `routes/post.js` for media uploads.
- Email: `EMAIL_USER`/`EMAIL_PASS` used in `routes/user.js` with Nodemailer (Gmail service).


## Notes & Known Limitations
- Reset‑link URL: The email template in `routes/user.js` currently hard‑codes a Render URL. Update it to your deployment/base URL if you fork this project.
- View counts: Some view‑count routes exist but the `views`/`viewedPosts` fields are not defined in the current schemas; treat view counts as experimental.
- Duplicate home route: `Index.js` defines `/` and `routes/staticRouter.js` also declares `/`. The main home page is served by the `/` route in `Index.js`.
- Password hashing: Implemented with salted HMAC‑SHA256 via Node’s `crypto`. Bcrypt is included as a dependency but not used in the current implementation.


## Development Tips
- Ensure all Cloudinary and Google OAuth env vars are set before creating posts or using Google login.
- For Gmail, use an App Password (2FA must be enabled) and set `EMAIL_USER`/`EMAIL_PASS` accordingly.
- In production, set the cookie to `secure: true` and serve behind HTTPS.

## Scripts
```cmd
npm run dev   // start with nodemon on http://localhost:8000
npm start     // start with node
```

## License
ISC — see `package.json`.

## Acknowledgements
- Passport.js Google OAuth 2.0
- Cloudinary for media storage
- MongoDB Atlas
