# MiniBlog — Full Stack Web Development Lab (Experiment 1(b))

A Twitter-inspired microblogging application with clean navigation, responsive UI, authentication, publishing, comments, likes, and follow-based feeds. Built for the 22ITL51 Full Stack Web Development Laboratory syllabus.

## Features

- Register and sign in with a username/email and password.
- Create text posts (up to 1,000 characters) and attach an image.
- View the For You feed, the Following feed, Explore, and your own profile.
- Follow and unfollow people; follower/following counts update from stored relationships.
- Following feed shows posts from accounts you follow plus your own posts.
- Like/unlike posts and add comments.
- Search posts and people from Explore.
- Delete your own posts.
- MongoDB persistence, JWT authentication, password hashing, and API-side validation.
- Responsive layout for desktop, tablet, and mobile.

## Requirements

- Node.js 20 or newer.
- MongoDB running locally, or a MongoDB Atlas connection string.
- A modern browser.

## 1. Start MongoDB

For a local database, make sure your MongoDB server is running. The default URI is:

```text
mongodb://127.0.0.1:27017/miniblog
```

For MongoDB Atlas, copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` to your Atlas connection string.

## 2. Configure and start the backend

Open a terminal in the project folder:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set a unique `JWT_SECRET`. The default local MongoDB URI can be kept if you are using MongoDB locally.

```bash
npm run dev
```

The API should be available at `http://localhost:5000`. Check `http://localhost:5000/api/health` to confirm it is running.

## 3. Optional: load demo users and posts

Open a second terminal:

```bash
cd backend
npm run seed
```

Demo login:

- Email: `kamali@demo.com`
- Password: `demo12345`

Other demo users are `arun@demo.com`, `priya@demo.com`, `rahul@demo.com`, `divya@demo.com`, and `kevin@demo.com`. They all use the same demo password: `demo12345`.

The seed command adds sample records if they do not already exist; it does not clear the database. Kamali follows Arun and Priya so you can test the Following feed immediately.

## 4. Start the frontend

Open another terminal in the project folder:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL, normally `http://localhost:5173`.

If your backend runs at a different URL, copy `frontend/.env.example` to `frontend/.env` and update `VITE_API_URL`. Restart Vite after changing environment variables.

## Suggested demo flow

1. Sign in with the demo account, or create a new account.
2. Publish a post from the composer.
3. Open Explore or use the people-to-follow panel to follow another user.
4. Select Following and verify that the followed user's posts appear.
5. Like a post, open its comments, and add a reply.
6. Refresh the browser to confirm that posts, likes, comments, and follow relationships persist.
7. Sign in as another demo user to verify that each account has its own feed and relationships.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get the current account |
| `GET` | `/api/posts/feed?mode=for-you` | All recent posts |
| `GET` | `/api/posts/feed?mode=following` | Posts from followed people and yourself |
| `GET` | `/api/posts/feed?mode=profile` | Your own posts |
| `GET` | `/api/posts/feed?mode=explore&q=term` | Search posts and authors |
| `POST` | `/api/posts` | Publish a post |
| `POST` | `/api/posts/:id/like` | Like or unlike a post |
| `POST` | `/api/posts/:id/comments` | Add a comment |
| `DELETE` | `/api/posts/:id` | Delete your own post |
| `GET` | `/api/users/suggestions` | Find accounts to follow |
| `POST` | `/api/users/:id/follow` | Follow an account |
| `DELETE` | `/api/users/:id/follow` | Unfollow an account |
| `POST` | `/api/uploads` | Upload a post image (max. 5 MB) |

## Project structure

```text
miniblog-fullstack/
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── uploads/
│   └── src/
│       ├── middleware/auth.js
│       ├── models/Post.js
│       ├── models/User.js
│       ├── routes/auth.js
│       ├── routes/posts.js
│       ├── routes/uploads.js
│       ├── routes/users.js
│       ├── utils/serializeUser.js
│       ├── seed.js
│       └── server.js
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api.js
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## Notes

- The backend and MongoDB must both be running for posting, comments, likes, follows, and persistence to work.
- Uploaded images are stored in `backend/uploads/` for this local lab version. Keep the folder when moving the project.
- The demo credentials are only for local development. Do not deploy them publicly.
- For a hosted deployment, use a strong secret, configure the production client URL, and use managed file storage for uploads.
