import { Router } from "express";
import {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideoById,
} from "../controllers/video.controller.js";
import UploadToDisk from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/Auth.middleware.js";

const videoRouter = Router();

// Part 1️: Fetch all videos (with query, pagination, sort)
videoRouter.route("/videos").get(getAllVideos);

// Part 2️: Publish a new video (Upload video + thumbnail using Multer)
videoRouter.route("/post-video").post(
  verifyJWT,
  UploadToDisk.fields([
    { name: "video", maxCount: 1 }, // single video file
    { name: "thumbnail", maxCount: 1 }, // single thumbnail
  ]),
  publishVideo
);

// Part 3 : Get the video by Id
videoRouter.route("/:videoId").get(getVideoById);

// part 4: update the thumbnail, title, description
videoRouter
  .route("/update-video-detailes/:videoId")
  .patch(verifyJWT, UploadToDisk.single("thumbnail"), updateVideoById);
export default videoRouter;
