import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// helper function
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import tweetRouter from "./routes/tweet.route.js";
import playlistRouter from "./routes/playlist.route.js";
import likeRouter from "./routes/like.route.js";
import commentRouter from "./routes/comment.route.js";
import dashboardRouter from "./routes/dashboard.route.js";

// user router
app.use("/api/v1/users", userRouter);

// video router
app.use("/api/v1/videos", videoRouter);

// tweet router
app.use("/api/v1/tweets", tweetRouter);

// subscription router
app.use("/api/v1/subscriptions", subscriptionRouter);

// playlist router
app.use("/api/v1/playlists", playlistRouter);

// like router
app.use("/api/v1/likes", likeRouter);

// comment router
app.use("/api/v1/comments", commentRouter);

// dashboard router
app.use("/api/v1/dashboards", dashboardRouter);

export default app;
